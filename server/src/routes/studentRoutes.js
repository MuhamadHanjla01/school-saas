const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const { dbCall } = require('../prismaClient');
const bcrypt = require('bcryptjs');
const { checkRole } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../public/uploads');
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
const upload = multer({ storage: storage });

// GET /api/students — list all students
router.get('/', async (req, res) => {
  try {
    const { classId, status, search } = req.query;
    const where = { schoolId: req.schoolId };
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
        where: { studentId: s.id },
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
      where: { id: req.params.id },
      include: {
        class: true,
        user: true,
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

    // Generate student ID
    const count = await prisma.student.count({ where: { schoolId: req.schoolId } });
    const studentId = `STD-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const student = await prisma.student.create({
      data: { 
        studentId, 
        name, 
        guardianName, 
        phone, 
        classId, 
        schoolId: req.schoolId,
        middleName, lastName, dob: dob ? new Date(dob) : null, gender, bloodGroup, nationality, studentEmail,
        motherName, parentRelationship, parentEmail, emergencyContact,
        country, state, city, municipality, ward, street, postalCode,
        prevSchool, prevQualification, prevClass, prevRoll, prevGpa, tcNumber,
        admissionDate: admissionDate ? new Date(admissionDate) : null, academicYear, campus, section, rollNumber, house, medium, shift, 
        transportRequired: !!transportRequired, 
        hostelRequired: !!hostelRequired
      },
    });

    // Optionally create user account (Step 3)
    const userEmail = studentEmail || email || `${studentId.toLowerCase()}@school.edu`;
    const userPassword = password || 'student123';
    const hash = await bcrypt.hash(userPassword, 10);
    
    await prisma.user.create({
      data: { 
        email: userEmail, 
        passwordHash: hash, 
        role: 'Student', 
        studentId: student.id, 
        schoolId: req.schoolId 
      },
    });

    res.status(201).json({ student });
  } catch (error) {
    console.error('[students] POST error:', error.message);
    res.status(500).json({ error: 'Failed to create student' });
  }
});

// PUT /api/students/:id — update student
router.put('/:id', checkRole(['SchoolAdmin', 'SuperAdmin']), upload.single('avatar'), async (req, res) => {
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
      where: { id: req.params.id },
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
        where: { studentId: req.params.id }
      }));

      if (user) {
        // Delete old avatar if it exists
        if (user.avatar && user.avatar.startsWith('/uploads/')) {
          const oldPath = path.join(__dirname, '../../public', user.avatar);
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
          io.emit('profile_updated', { userId: user.id, studentId: student.id });
        }
      }
    } else {
       // If no avatar is uploaded, we might still want to update user name/phone and emit event
       const user = await dbCall(() => prisma.user.findFirst({
        where: { studentId: req.params.id }
      }));
      if (user) {
        await dbCall(() => prisma.user.update({
          where: { id: user.id },
          data: { name, phone }
        }));
        const io = req.app.get('io');
        if (io) {
          io.emit('profile_updated', { userId: user.id, studentId: student.id });
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
      where: { studentId: req.params.id }
    }));

    await dbCall(() => prisma.student.delete({
      where: { id: req.params.id },
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
    const passwordToSet = newPassword || 'student123';

    const student = await dbCall(() => prisma.student.findUnique({
      where: { id: req.params.id },
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
      return res.json({ message: 'User account created with new password.', password: passwordToSet });
    }

    // Admins can reset directly, oldPassword verification is optional if strictly needed.
    // For now we just apply the new password
    const hash = await bcrypt.hash(passwordToSet, 10);
    await dbCall(() => prisma.user.update({
      where: { id: student.user.id },
      data: { passwordHash: hash },
    }));

    res.json({ message: 'Password reset successfully', password: passwordToSet });
  } catch (error) {
    console.error('[students] POST reset-password error:', error.message);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

module.exports = router;
