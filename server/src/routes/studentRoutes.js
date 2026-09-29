const express = require('express');
const router = express.Router();
const { secureRouter, validateRequestReferences, requireRecord, ADMIN_ROLES, STAFF_ROLES, safeUserSelect, studentScope, classScope, noProfileId } = require('../middleware/routeSecurity');
secureRouter(router, { model: 'student', readRoles: [...STAFF_ROLES, 'Student'] });
const prisma = require('../prismaClient');
const { dbCall } = require('../prismaClient');
const bcrypt = require('bcryptjs');
const { checkRole } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024, files: 1 }, fileFilter(req, file, cb) { const allowed = ['image/jpeg', 'image/png', 'image/webp']; const ok = allowed.includes(file.mimetype) && ['.jpg', '.jpeg', '.png', '.webp'].includes(path.extname(file.originalname).toLowerCase()); cb(ok ? null : Object.assign(new Error('Only PNG, JPEG and WebP avatars are allowed'), { status: 400 }), ok); } });

router.get('/me/profile', checkRole(['Student']), async (req, res) => {
  try {
    const student = await prisma.student.findFirst({
      where: { id: req.user.studentId || noProfileId, schoolId: req.schoolId },
      include: { class: true, user: { select: safeUserSelect }, feePayments: { where: { schoolId: req.schoolId }, include: { fee: true } }, examResults: { where: { exam: { schoolId: req.schoolId } }, include: { exam: true, subject: true } } },
    });
    if (!student) return res.status(404).json({ error: 'Student profile not found' });
    res.json({ student });
  } catch (error) { res.status(500).json({ error: 'Failed to load student profile' }); }
});

// GET /api/students — list all students
router.get('/', async (req, res) => {
  try {
    const { classId, status, search } = req.query;
    const where = { schoolId: req.schoolId, ...(req.user.role === 'Student' ? { id: req.user.studentId || noProfileId } : {}) };
    if (classId) where.classId = classId;
    
    if (status && status !== 'All') {
      where.status = status;
    } else if (!status) {
      where.status = 'Active';
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { studentId: { contains: search } },
      ];
    }

    const students = await dbCall(() => prisma.student.findMany({
      where,
      include: { 
        class: { select: { name: true } },
        user: { select: { id: true } }
      },
      orderBy: { createdAt: 'desc' },
    }));

    // Attach fee status
    const withFees = await Promise.all(students.map(async (s) => {
      const latestPayment = await prisma.feePayment.findFirst({
        where: { studentId: s.id, schoolId: req.schoolId },
        orderBy: { createdAt: 'desc' },
      });
      return {
        ...s,
        className: s.class?.name || 'Unassigned',
        feeStatus: latestPayment?.status || 'N/A',
      };
    }));

    res.json({ students: withFees });
  } catch (error) {
    console.error('[students] GET error:', error.message);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// GET /api/students/:id — get single student
router.get('/:id', async (req, res) => {
  try {
    const student = await dbCall(() => prisma.student.findUnique({
      where: { id: req.params.id, schoolId: req.schoolId },
      include: {
        class: true,
        user: { select: safeUserSelect },
        feePayments: { include: { fee: true } },
        examResults: { include: { exam: true, subject: true } },
      },
    }));
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json({ student });
  } catch (error) {
    console.error('[students] GET :id error:', error.message);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
});

// POST /api/students — create student + user account
router.post('/', checkRole(['SchoolAdmin', 'SuperAdmin']), async (req, res) => {
  try {
    const { 
      name, guardianName, phone, classId, email,
      // Wizard Fields
      middleName, lastName, dob, gender, bloodGroup, nationality, studentEmail,
      motherName, parentRelationship, parentEmail, emergencyContact,
      country, state, city, municipality, ward, street, postalCode,
      prevSchool, prevQualification, prevClass, prevRoll, prevGpa, tcNumber,
      admissionDate, academicYear, campus, section, rollNumber, house, medium, shift, transportRequired, hostelRequired,
      // Step 3 Password
      password
    } = req.body;

    if (!name || !guardianName || !phone) {
      return res.status(400).json({ error: 'Name, guardian name, and phone are required' });
    }

    if (typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) return res.status(400).json({ error: 'A password of at least 8 characters and at most 72 bytes is required' });
    const studentId = `STD-${new Date().getFullYear()}-${require('crypto').randomUUID().slice(0, 8).toUpperCase()}`;
    const userEmail = (studentEmail || email || `${studentId.toLowerCase()}@school.edu`).trim().toLowerCase();
    const hash = await bcrypt.hash(password, 10);

    const student = await prisma.$transaction(async (tx) => {
    const created = await tx.student.create({
      data: { 
        studentId, 
        name, 
        guardianName, 
        phone, 
        classId: classId || null,
        schoolId: req.schoolId,
        middleName, lastName, dob: dob ? new Date(dob) : null, gender, bloodGroup, nationality, studentEmail,
        motherName, parentRelationship, parentEmail, emergencyContact,
        country, state, city, municipality, ward, street, postalCode,
        prevSchool, prevQualification, prevClass, prevRoll, prevGpa, tcNumber,
        admissionDate: admissionDate ? new Date(admissionDate) : null, academicYear, campus, section, rollNumber, house, medium, shift, 
        transportRequired: String(transportRequired) === 'true',
        hostelRequired: String(hostelRequired) === 'true'
      },
    });

    await tx.user.create({
      data: { 
        email: userEmail, 
        passwordHash: hash, 
        role: 'Student', 
        studentId: created.id,
        name, phone,
        schoolId: req.schoolId 
      },
    });
    return created;
    });

    res.status(201).json({ student });
  } catch (error) {
    console.error('[students] POST error:', error.message);
    if (error.code === 'P2002') return res.status(409).json({ error: 'A student account with this email already exists' });
    res.status(500).json({ error: 'Failed to create student' });
  }
});

// PUT /api/students/:id — update student
router.put('/:id', checkRole(['SchoolAdmin', 'SuperAdmin']), upload.single('avatar'), validateRequestReferences, async (req, res) => {
  try {
    const { 
      name, guardianName, phone, classId, status,
      middleName, lastName, dob, gender, bloodGroup, nationality, studentEmail,
      motherName, parentRelationship, parentEmail, emergencyContact,
      country, state, city, municipality, ward, street, postalCode,
      prevSchool, prevQualification, prevClass, prevRoll, prevGpa, tcNumber,
      admissionDate, academicYear, campus, section, rollNumber, house, medium, shift, 
      transportRequired, hostelRequired
    } = req.body;
    
    const student = await dbCall(() => prisma.student.update({
      where: { id: req.params.id, schoolId: req.schoolId },
      data: { 
        name, guardianName, phone, classId, status,
        middleName, lastName, dob: dob ? new Date(dob) : undefined, gender, bloodGroup, nationality, studentEmail,
        motherName, parentRelationship, parentEmail, emergencyContact,
        country, state, city, municipality, ward, street, postalCode,
        prevSchool, prevQualification, prevClass, prevRoll, prevGpa, tcNumber,
        admissionDate: admissionDate ? new Date(admissionDate) : undefined, 
        academicYear, campus, section, rollNumber, house, medium, shift, 
        transportRequired: transportRequired !== undefined ? String(transportRequired) === 'true' : undefined, 
        hostelRequired: hostelRequired !== undefined ? String(hostelRequired) === 'true' : undefined
      },
    }));

    let avatarUrl = undefined;
    if (req.file) {
      avatarUrl = `/uploads/${req.file.filename}`;
      // Find the associated user
      const user = await dbCall(() => prisma.user.findFirst({
        where: { studentId: req.params.id, schoolId: req.schoolId }
      }));

      if (user) {
        // Delete old avatar if it exists
        if (user.avatar && /^\/uploads\/[a-zA-Z0-9_.-]+$/.test(user.avatar)) {
          const oldPath = path.join(uploadDir, path.basename(user.avatar));
          if (fs.existsSync(oldPath)) {
            try {
              fs.unlinkSync(oldPath);
            } catch (err) {
              console.error('[students] Failed to delete old avatar:', err);
            }
          }
        }
        
        // Update user's avatar and name/phone
        await dbCall(() => prisma.user.update({
          where: { id: user.id },
          data: { avatar: avatarUrl, name, phone }
        }));
        
        // Emit profile_updated event to notify the Flutter app instantly
        const io = req.app.get('io');
        if (io) {
          io.to(`user_${user.id}`).emit('profile_updated', { userId: user.id, studentId: student.id });
        }
      }
    } else {
       // If no avatar is uploaded, we might still want to update user name/phone and emit event
       const user = await dbCall(() => prisma.user.findFirst({
        where: { studentId: req.params.id, schoolId: req.schoolId }
      }));
      if (user) {
        await dbCall(() => prisma.user.update({
          where: { id: user.id },
          data: { name, phone }
        }));
        const io = req.app.get('io');
        if (io) {
          io.to(`user_${user.id}`).emit('profile_updated', { userId: user.id, studentId: student.id });
        }
      }
    }

    res.json({ student, avatarUrl });
  } catch (error) {
    console.error('[students] PUT error:', error.message);
    res.status(500).json({ error: 'Failed to update student' });
  }
});

// DELETE /api/students/:id — hard delete student
router.delete('/:id', checkRole(['SchoolAdmin', 'SuperAdmin']), async (req, res) => {
  try {
    // Delete associated user first to avoid foreign key constraints
    await dbCall(() => prisma.user.deleteMany({
      where: { studentId: req.params.id, schoolId: req.schoolId }
    }));

    await dbCall(() => prisma.student.delete({
      where: { id: req.params.id, schoolId: req.schoolId },
    }));
    res.json({ message: 'Student deleted permanently' });
  } catch (error) {
    console.error('[students] DELETE error:', error.message);
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

// POST /api/students/:id/reset-password — reset student password
router.post('/:id/reset-password', checkRole(['SchoolAdmin', 'SuperAdmin']), async (req, res) => {
  try {
    const { newPassword, oldPassword } = req.body;
    const passwordToSet = newPassword;
    if (typeof passwordToSet !== 'string' || passwordToSet.length < 8 || Buffer.byteLength(passwordToSet, 'utf8') > 72) return res.status(400).json({ error: 'A new password of at least 8 characters and at most 72 bytes is required' });

    const student = await dbCall(() => prisma.student.findUnique({
      where: { id: req.params.id, schoolId: req.schoolId },
      include: { user: true }
    }));

    if (!student) return res.status(404).json({ error: 'Student not found' });
    if (!student.user) {
      // If user doesn't exist, create one
      const email = `${student.studentId.toLowerCase()}@school.edu`;
      const hash = await bcrypt.hash(passwordToSet, 10);
      await prisma.user.create({
        data: { email, passwordHash: hash, role: 'Student', studentId: student.id, schoolId: req.schoolId },
      });
      return res.json({ message: 'User account created with new password.' });
    }

    // Admins can reset directly, oldPassword verification is optional if strictly needed.
    // For now we just apply the new password
    const hash = await bcrypt.hash(passwordToSet, 10);
    await dbCall(() => prisma.user.update({
      where: { id: student.user.id },
      data: { passwordHash: hash, refreshToken: null },
    }));

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('[students] POST reset-password error:', error.message);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

module.exports = router;
