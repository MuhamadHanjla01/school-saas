const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const { dbCall } = require('../prismaClient');
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

    res.json({ teachers: withCounts });
  } catch (error) {
    console.error('[teachers] GET error:', error.message);
    res.status(500).json({ error: 'Failed to fetch teachers' });
  }
});

// GET /api/teachers/:id — get single teacher
router.get('/:id', async (req, res) => {
  try {
    const teacher = await dbCall(() => prisma.teacher.findUnique({
      where: { id: req.params.id },
      include: {
        subjects: { include: { class: { select: { name: true } } } },
        classTeacher: { select: { name: true, id: true } },
        salaries: { orderBy: { createdAt: 'desc' } },
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
      where: { id: req.params.id },
      data: { department, title }
    }));

    // If a classId is provided, assign them as class teacher
    // We optionally remove them from previous classes if they can only have one, but schema says it's 1-to-many (Teacher has many classes they are class teacher of)
    // Actually, Class has `classTeacherId`, so we just update the Class
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
    
    const teacher = await dbCall(() => prisma.teacher.findUnique({
      where: { id: req.params.id },
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
        passwordHash: hash
      }
    }));

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('[teachers] POST reset-password error:', error.message);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// GET /api/teachers/me/profile — get current teacher's profile
router.get('/me/profile', async (req, res) => {
  try {
    const user = await dbCall(() => prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { teacher: true },
    }));
    if (!user?.teacher) return res.status(404).json({ error: 'Teacher profile not found' });
    
    // Also include user info (email)
    res.json({ teacher: user.teacher, email: user.email });
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
      where: { teacherId: user.teacher.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ salaries });
  } catch (error) {
    console.error('[teachers] GET me/salary error:', error.message);
    res.status(500).json({ error: 'Failed to fetch salary' });
  }
});

// POST /api/teachers — create teacher
router.post('/', checkRole(['SchoolAdmin', 'SuperAdmin']), async (req, res) => {
  try {
    const { name, department, phone, email } = req.body;
    if (!name || !department || !phone) {
      return res.status(400).json({ error: 'Name, department, and phone are required' });
    }

    const count = await prisma.teacher.count({ where: { schoolId: req.schoolId } });
    const employeeId = `T-${2024 + Math.floor(count / 100)}-${String(count + 1).padStart(3, '0')}`;

    const teacher = await prisma.teacher.create({
      data: { employeeId, name, department, phone, schoolId: req.schoolId },
    });

    if (email) {
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('teacher123', 10);
      await prisma.user.create({
        data: { email, passwordHash: hash, role: 'Teacher', teacherId: teacher.id, schoolId: req.schoolId },
      });
    }

    res.status(201).json({ teacher });
  } catch (error) {
    console.error('[teachers] POST error:', error.message);
    res.status(500).json({ error: 'Failed to create teacher' });
  }
});

// PUT /api/teachers/:id — update teacher
router.put('/:id', checkRole(['SchoolAdmin', 'SuperAdmin']), upload.single('avatar'), async (req, res) => {
  try {
    const { name, department, phone, status } = req.body;
    const teacher = await dbCall(() => prisma.teacher.update({
      where: { id: req.params.id },
      data: { name, department, phone, status },
    }));

    let avatarUrl = undefined;
    if (req.file) {
      avatarUrl = `/uploads/${req.file.filename}`;
      const user = await dbCall(() => prisma.user.findFirst({
        where: { teacherId: req.params.id }
      }));

      if (user) {
        if (user.avatar && user.avatar.startsWith('/uploads/')) {
          const oldPath = path.join(__dirname, '../../public', user.avatar);
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
          io.emit('profile_updated', { userId: user.id, teacherId: teacher.id });
        }
      }
    } else {
       const user = await dbCall(() => prisma.user.findFirst({
        where: { teacherId: req.params.id }
      }));
      if (user) {
        await dbCall(() => prisma.user.update({
          where: { id: user.id },
          data: { name, phone }
        }));
        const io = req.app.get('io');
        if (io) {
          io.emit('profile_updated', { userId: user.id, teacherId: teacher.id });
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
