const express = require('express');
const router = express.Router();
const { secureRouter, validateRequestReferences, requireRecord, ADMIN_ROLES, STAFF_ROLES, safeUserSelect, studentScope, classScope, noProfileId } = require('../middleware/routeSecurity');
secureRouter(router, { model: 'teacher', selfTeacher: true });
const prisma = require('../prismaClient');
const { dbCall } = require('../prismaClient');
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

// GET /api/teachers — list all teachers
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    const where = { schoolId: req.schoolId };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { department: { contains: search } },
        { employeeId: { contains: search } },
      ];
    }

    const teachers = await dbCall(() => prisma.teacher.findMany({
      where,
      include: {
        subjects: { select: { name: true } },
        classTeacher: { select: { name: true } },
        user: { select: { id: true } }
      },
      orderBy: { name: 'asc' },
    }));

    const withCounts = teachers.map(t => ({
      ...t,
      classCount: t.classTeacher.length,
      subjectNames: [...new Set(t.subjects.map(s => s.name))],
    }));

    res.json({ teachers: req.user.role === 'Student' || req.user.role === 'Parent' ? withCounts.map(t => ({ id: t.id, name: t.name, department: t.department, subjectNames: t.subjectNames, user: t.user })) : withCounts });
  } catch (error) {
    console.error('[teachers] GET error:', error.message);
    res.status(500).json({ error: 'Failed to fetch teachers' });
  }
});

// ─── /me/* routes MUST be defined before /:id to avoid Express matching "me" as an id param ───

// GET /api/teachers/me/profile — get current teacher's profile
router.get('/me/profile', async (req, res) => {
  try {
    const user = await dbCall(() => prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        teacher: {
          include: {
            subjects: { select: { name: true } },
            classTeacher: { select: { name: true, id: true } },
          }
        }
      },
    }));
    if (!user?.teacher) return res.status(404).json({ error: 'Teacher profile not found' });
    
    const teacher = {
      ...user.teacher,
      classCount: user.teacher.classTeacher?.length || 0,
      subjectNames: [...new Set((user.teacher.subjects || []).map(s => s.name))],
    };
    res.json({ teacher, email: user.email });
  } catch (error) {
    console.error('[teachers] GET me/profile error:', error.message);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// PUT /api/teachers/me/profile — update current teacher's profile
router.put('/me/profile', async (req, res) => {
  try {
    const user = await dbCall(() => prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { teacher: true },
    }));
    if (!user?.teacher) return res.status(404).json({ error: 'Teacher profile not found' });

    const { name, department, phone, title, about, address, qualifications } = req.body;
    
    const teacher = await dbCall(() => prisma.teacher.update({
      where: { id: user.teacher.id },
      data: { name, department, phone, title, about, address, qualifications },
    }));
    res.json({ teacher });
  } catch (error) {
    console.error('[teachers] PUT me/profile error:', error.message);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// GET /api/teachers/me/salary — get current teacher's salary
router.get('/me/salary', async (req, res) => {
  try {
    const user = await dbCall(() => prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { teacher: true },
    }));
    if (!user?.teacher) return res.status(404).json({ error: 'Teacher profile not found' });

    const salaries = await prisma.salary.findMany({
      where: { teacherId: user.teacher.id, schoolId: req.schoolId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ salaries });
  } catch (error) {
    console.error('[teachers] GET me/salary error:', error.message);
    res.status(500).json({ error: 'Failed to fetch salary' });
  }
});

// GET /api/teachers/me/dashboard — teacher-specific dashboard stats
router.get('/me/dashboard', async (req, res) => {
  try {
    const user = await dbCall(() => prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        teacher: {
          include: {
            subjects: { select: { name: true } },
            classTeacher: { select: { id: true, name: true, _count: { select: { students: true } } } },
          }
        }
      },
    }));
    if (!user?.teacher) return res.status(404).json({ error: 'Teacher profile not found' });

    const teacherId = user.teacher.id;
    const myClassIds = (user.teacher.classTeacher || []).map(c => c.id);

    // Count students across teacher's classes
    const totalStudents = myClassIds.length > 0
      ? await prisma.student.count({ where: { classId: { in: myClassIds }, status: 'Active', schoolId: req.schoolId } })
      : 0;

    // Count assignments by this teacher
    const totalAssignments = await prisma.assignment.count({ where: { teacherId, schoolId: req.schoolId } });
    const activeAssignments = await prisma.assignment.count({ where: { teacherId, schoolId: req.schoolId, status: 'Active' } });

    // Today's attendance for teacher's classes
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    let attendanceRate = '0';
    if (myClassIds.length > 0) {
      const todayAttendance = await prisma.attendance.findMany({
        where: { date: { gte: today, lt: tomorrow }, classId: { in: myClassIds }, schoolId: req.schoolId }
      });
      const presentCount = todayAttendance.filter(a => a.status === 'Present').length;
      attendanceRate = todayAttendance.length > 0 ? ((presentCount / todayAttendance.length) * 100).toFixed(1) : '0';
    }

    // Recent notices
    const recentNotices = await prisma.notice.findMany({
      where: { schoolId: req.schoolId },
      orderBy: { date: 'desc' },
      take: 3,
    });

    res.json({
      stats: [
        { label: 'My Classes', value: String(myClassIds.length), icon: 'class', color: '#0060ac' },
        { label: 'My Students', value: String(totalStudents), icon: 'groups', color: '#006b5c' },
        { label: 'Active Assignments', value: String(activeAssignments), icon: 'assignment', color: '#9d4224' },
        { label: 'Attendance Rate', value: `${attendanceRate}%`, icon: 'trending_up', color: '#5b5f62', isHealth: true },
      ],
      subjectNames: [...new Set((user.teacher.subjects || []).map(s => s.name))],
      classes: (user.teacher.classTeacher || []).map(c => ({ id: c.id, name: c.name, students: c._count?.students || 0 })),
      recentNotices: recentNotices.map(n => ({ id: n.id, title: n.title, content: n.content, date: n.date })),
    });
  } catch (error) {
    console.error('[teachers] GET me/dashboard error:', error.message);
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
});

// ─── Parameterized routes below ─────────────────────────────────────────────

// GET /api/teachers/:id — get single teacher
router.get('/:id', checkRole(STAFF_ROLES), async (req, res) => {
  try {
    const teacher = await dbCall(() => prisma.teacher.findUnique({
      where: { id: req.params.id, schoolId: req.schoolId },
      include: {
        subjects: { include: { class: { select: { name: true } } } },
        classTeacher: { select: { name: true, id: true } },
        salaries: { where: req.user.role === 'Teacher' && req.user.teacherId !== req.params.id ? { id: noProfileId } : { schoolId: req.schoolId }, orderBy: { createdAt: 'desc' } },
      },
    }));
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });
    res.json({ teacher });
  } catch (error) {
    console.error('[teachers] GET :id error:', error.message);
    res.status(500).json({ error: 'Failed to fetch teacher' });
  }
});

// PUT /api/teachers/:id/promote
router.put('/:id/promote', async (req, res) => {
  try {
    const { classId, department, title } = req.body;
    
    // Update teacher dept and title
    const teacher = await dbCall(() => prisma.teacher.update({
      where: { id: req.params.id, schoolId: req.schoolId },
      data: { department, title }
    }));

    // If a classId is provided, assign them as class teacher
    if (classId) {
      await dbCall(() => prisma.class.update({
        where: { id: classId },
        data: { classTeacherId: teacher.id }
      }));
    }

    res.json({ message: 'Teacher promoted successfully', teacher });
  } catch (error) {
    console.error('[teachers] PUT promote error:', error.message);
    res.status(500).json({ error: 'Failed to promote teacher' });
  }
});

// POST /api/teachers/:id/reset-password
router.post('/:id/reset-password', async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (typeof newPassword !== 'string' || newPassword.length < 8 || Buffer.byteLength(newPassword, 'utf8') > 72) return res.status(400).json({ error: 'A new password of at least 8 characters and at most 72 bytes is required' });
    
    const teacher = await dbCall(() => prisma.teacher.findUnique({
      where: { id: req.params.id, schoolId: req.schoolId },
      include: { user: true }
    }));

    if (!teacher || !teacher.user) {
      return res.status(404).json({ error: 'Teacher or associated user not found' });
    }

    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash(newPassword, 10);
    await dbCall(() => prisma.user.update({
      where: { id: teacher.user.id },
      data: { 
        passwordHash: hash, refreshToken: null
      }
    }));

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('[teachers] POST reset-password error:', error.message);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// POST /api/teachers — create teacher
router.post('/', checkRole(['SchoolAdmin', 'SuperAdmin']), async (req, res) => {
  try {
    const { name, department, phone, email } = req.body;
    if (!name || !department || !phone) {
      return res.status(400).json({ error: 'Name, department, and phone are required' });
    }

    const password = req.body.password;
    if (email && (typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password) > 72)) return res.status(400).json({ error: 'An account password of 8-72 bytes is required' });
    const employeeId = `T-${require('crypto').randomUUID().slice(0, 12).toUpperCase()}`;
    const hash = email ? await require('bcryptjs').hash(password, 12) : null;
    const teacher = await prisma.$transaction(async tx => {
      const created = await tx.teacher.create({ data: { employeeId, name, department, phone, schoolId: req.schoolId } });
      if (email) await tx.user.create({ data: { name, email: email.trim().toLowerCase(), passwordHash: hash, role: 'Teacher', teacherId: created.id, schoolId: req.schoolId } });
      return created;
    });

    res.status(201).json({ teacher });
  } catch (error) {
    console.error('[teachers] POST error:', error.message);
    res.status(500).json({ error: 'Failed to create teacher' });
  }
});

// PUT /api/teachers/:id — update teacher
router.put('/:id', checkRole(['SchoolAdmin', 'SuperAdmin']), upload.single('avatar'), validateRequestReferences, async (req, res) => {
  try {
    const { name, department, phone, status } = req.body;
    const teacher = await dbCall(() => prisma.teacher.update({
      where: { id: req.params.id, schoolId: req.schoolId },
      data: { name, department, phone, status },
    }));

    let avatarUrl = undefined;
    if (req.file) {
      avatarUrl = `/uploads/${req.file.filename}`;
      const user = await dbCall(() => prisma.user.findFirst({
        where: { teacherId: req.params.id, schoolId: req.schoolId }
      }));

      if (user) {
        if (user.avatar && /^\/uploads\/[a-zA-Z0-9_.-]+$/.test(user.avatar)) {
          const oldPath = path.join(uploadDir, path.basename(user.avatar));
          if (fs.existsSync(oldPath)) {
            try {
              fs.unlinkSync(oldPath);
            } catch (err) {
              console.error('[teachers] Failed to delete old avatar:', err);
            }
          }
        }
        
        await dbCall(() => prisma.user.update({
          where: { id: user.id },
          data: { avatar: avatarUrl, name, phone }
        }));
        
        const io = req.app.get('io');
        if (io) {
          io.to(`user_${user.id}`).emit('profile_updated', { userId: user.id, teacherId: teacher.id });
        }
      }
    } else {
       const user = await dbCall(() => prisma.user.findFirst({
        where: { teacherId: req.params.id, schoolId: req.schoolId }
      }));
      if (user) {
        await dbCall(() => prisma.user.update({
          where: { id: user.id },
          data: { name, phone }
        }));
        const io = req.app.get('io');
        if (io) {
          io.to(`user_${user.id}`).emit('profile_updated', { userId: user.id, teacherId: teacher.id });
        }
      }
    }

    res.json({ teacher, avatarUrl });
  } catch (error) {
    console.error('[teachers] PUT error:', error.message);
    res.status(500).json({ error: 'Failed to update teacher' });
  }
});

module.exports = router;
