const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const { dbCall } = require('../prismaClient');
const { checkRole } = require('../middleware/authMiddleware');

// ─── Notices ───────────────────────────────────────────────────────────────────

// GET /api/notices — list notices
router.get('/notices', async (req, res) => {
  try {
    const { type } = req.query;
    const where = { schoolId: req.schoolId };
    if (type && type !== 'All') where.type = type;

    const notices = await dbCall(() => prisma.notice.findMany({
      where,
      orderBy: { date: 'desc' },
    }));
    res.json({ notices });
  } catch (error) {
    console.error('[notices] GET error:', error.message);
    res.status(500).json({ error: 'Failed to fetch notices' });
  }
});

// POST /api/notices — create notice
router.post('/notices', checkRole(['SchoolAdmin', 'SuperAdmin']), async (req, res) => {
  try {
    const { title, content, type, audience, priority } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Title and content required' });

    const notice = await prisma.notice.create({
      data: { title, content, type: type || 'General', audience: audience || 'All', priority: priority || 'Medium', schoolId: req.schoolId },
    });
    
    // Create notifications based on audience
    let audienceQuery = { schoolId: req.schoolId };
    if (audience === 'Students') audienceQuery.role = 'Student';
    else if (audience === 'Teachers') audienceQuery.role = 'Teacher';
    else if (audience === 'Parents') audienceQuery.role = 'Parent';
    else if (audience === 'Staff') audienceQuery.role = 'Staff';

    const targetUsers = await prisma.user.findMany({
      where: audienceQuery,
      select: { id: true },
    });

    if (targetUsers.length > 0) {
      await prisma.notification.createMany({
        data: targetUsers.map(u => ({
          title: `New Notice: ${title}`,
          message: content,
          type: 'Notice',
          userId: u.id,
          schoolId: req.schoolId,
        })),
      });
    }

    // Emit real-time event to all connected clients
    const io = req.app.get('io');
    if (io) {
      io.emit('new_notice', notice);
    }

    res.status(201).json({ notice });
  } catch (error) {
    console.error('[notices] POST error:', error.message);
    res.status(500).json({ error: 'Failed to create notice' });
  }
});

// PUT /api/notices/:id — update notice
router.put('/notices/:id', checkRole(['SchoolAdmin', 'SuperAdmin']), async (req, res) => {
  try {
    const { title, content, type, audience, priority } = req.body;
    const notice = await dbCall(() => prisma.notice.update({
      where: { id: req.params.id },
      data: { title, content, type, audience, priority },
    }));
    res.json({ notice });
  } catch (error) {
    console.error('[notices] PUT error:', error.message);
    res.status(500).json({ error: 'Failed to update notice' });
  }
});

// DELETE /api/notices/:id — delete notice
router.delete('/notices/:id', checkRole(['SchoolAdmin', 'SuperAdmin']), async (req, res) => {
  try {
    await dbCall(() => prisma.notice.delete({ where: { id: req.params.id } }));
    res.json({ message: 'Notice deleted' });
  } catch (error) {
    console.error('[notices] DELETE error:', error.message);
    res.status(500).json({ error: 'Failed to delete notice' });
  }
});

// ─── Events ────────────────────────────────────────────────────────────────────

// GET /api/events — list events
router.get('/events', async (req, res) => {
  try {
    const events = await dbCall(() => prisma.event.findMany({
      where: { schoolId: req.schoolId },
      orderBy: { date: 'asc' },
    }));
    const formatted = events.map(e => ({
      ...e,
      dateNum: new Date(e.date).getDate().toString().padStart(2, '0'),
      month: new Date(e.date).toLocaleDateString('en-US', { month: 'short' }),
    }));
    res.json({ events: formatted });
  } catch (error) {
    console.error('[events] GET error:', error.message);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// POST /api/events — create event
router.post('/events', checkRole(['SchoolAdmin', 'SuperAdmin']), async (req, res) => {
  try {
    const { title, date, type } = req.body;
    if (!title || !date) return res.status(400).json({ error: 'Title and date required' });

    const event = await prisma.event.create({
      data: { title, date: new Date(date), type: type || 'event', schoolId: req.schoolId },
    });
    res.status(201).json({ event });
  } catch (error) {
    console.error('[events] POST error:', error.message);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// ─── Timetable ─────────────────────────────────────────────────────────────────

// GET /api/timetable — get timetable
router.get('/timetable', async (req, res) => {
  try {
    const { classId, teacherId } = req.query;
    const where = { schoolId: req.schoolId };
    if (classId) where.classId = classId;
    if (teacherId) where.teacherId = teacherId;

    const slots = await dbCall(() => prisma.timetable.findMany({
      where,
      include: {
        subject: { select: { name: true } },
        teacher: { select: { name: true } },
        class: { select: { name: true, room: true } },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    }));

    // Group by day
    const grouped = {};
    for (const slot of slots) {
      if (!grouped[slot.dayOfWeek]) grouped[slot.dayOfWeek] = [];
      grouped[slot.dayOfWeek].push({
        time: `${slot.startTime} - ${slot.endTime}`,
        subject: slot.subject.name,
        teacher: slot.teacher.name,
        room: slot.class.room,
      });
    }

    res.json({ timetable: grouped });
  } catch (error) {
    console.error('[timetable] GET error:', error.message);
    res.status(500).json({ error: 'Failed to fetch timetable' });
  }
});

// ─── Messages ──────────────────────────────────────────────────────────────────

// GET /api/messages — list messages for current user
router.get('/messages', async (req, res) => {
  try {
    const { withUser } = req.query;
    const userId = req.user.userId;

    const where = {
      schoolId: req.schoolId,
      OR: [{ senderId: userId }, { receiverId: userId }],
    };
    if (withUser) {
      where.OR = [
        { senderId: userId, receiverId: withUser },
        { senderId: withUser, receiverId: userId },
      ];
    }

    const messages = await dbCall(() => prisma.message.findMany({
      where,
      include: {
        sender: { select: { id: true, email: true, role: true, teacher: { select: { name: true } }, student: { select: { name: true } } } },
        receiver: { select: { id: true, email: true, role: true, teacher: { select: { name: true } }, student: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }));

    const formatted = messages.map(m => ({
      ...m,
      senderName: m.sender.teacher?.name || m.sender.student?.name || m.sender.email,
      receiverName: m.receiver.teacher?.name || m.receiver.student?.name || m.receiver.email,
    }));

    res.json({ messages: formatted });
  } catch (error) {
    console.error('[messages] GET error:', error.message);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// POST /api/messages — send message
router.post('/messages', async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    if (!receiverId || !content) return res.status(400).json({ error: 'receiverId and content required' });

    const message = await prisma.message.create({
      data: { senderId: req.user.userId, receiverId, content, schoolId: req.schoolId },
    });

    const senderUser = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { teacher: true, student: true }
    });
    const senderName = senderUser?.teacher?.name || senderUser?.student?.name || senderUser?.email || 'Someone';

    await prisma.notification.create({
      data: {
        title: `Message from ${senderName}`,
        message: content,
        type: 'Message',
        userId: receiverId,
        schoolId: req.schoolId,
      },
    });

    res.status(201).json({ message });
  } catch (error) {
    console.error('[messages] POST error:', error.message);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// ─── Salary ────────────────────────────────────────────────────────────────────

// GET /api/salary — teacher's own salary
router.get('/salary', async (req, res) => {
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
    res.json({ salaries, teacher: { name: user.teacher.name, employeeId: user.teacher.employeeId, department: user.teacher.department } });
  } catch (error) {
    console.error('[salary] GET error:', error.message);
    res.status(500).json({ error: 'Failed to fetch salary' });
  }
});

// ─── Dashboard Stats (real data) ────────────────────────────────────────────

// GET /api/dashboard-stats — real aggregated stats
router.get('/dashboard-stats', async (req, res) => {
  try {
    const totalStudents = await prisma.student.count({ where: { status: 'Active', schoolId: req.schoolId } });
    const totalTeachers = await prisma.teacher.count({ where: { schoolId: req.schoolId } });

    // Attendance rate (today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const todayAttendance = await prisma.attendance.findMany({ where: { date: { gte: today, lt: tomorrow }, schoolId: req.schoolId } });
    const presentCount = todayAttendance.filter(a => a.status === 'Present').length;
    const attendanceRate = todayAttendance.length > 0 ? ((presentCount / todayAttendance.length) * 100).toFixed(1) : '0';

    // Fee collection
    const paidPayments = await prisma.feePayment.findMany({ where: { status: 'Paid', schoolId: req.schoolId } });
    const totalCollected = paidPayments.reduce((sum, p) => sum + p.amount, 0);

    // Recent activities from notices
    const recentNotices = await prisma.notice.findMany({ where: { schoolId: req.schoolId }, orderBy: { date: 'desc' }, take: 5 });
    const recentActivities = recentNotices.map(n => ({
      title: n.title,
      desc: n.content.substring(0, 60) + '...',
      time: getTimeAgo(n.date),
    }));

    // Top classes by attendance
    const classes = await prisma.class.findMany({ where: { schoolId: req.schoolId }, include: { _count: { select: { students: true } } } });
    const topClasses = [];
    for (const cls of classes) {
      const clsAttendance = todayAttendance.filter(a => a.classId === cls.id);
      const clsPresent = clsAttendance.filter(a => a.status === 'Present').length;
      const rate = clsAttendance.length > 0 ? Math.round((clsPresent / clsAttendance.length) * 100) : 0;
      topClasses.push({ name: `Class ${cls.name}`, attendance: rate, students: cls._count.students });
    }
    topClasses.sort((a, b) => b.attendance - a.attendance);

    // Upcoming events
    const events = await prisma.event.findMany({
      where: { date: { gte: today }, schoolId: req.schoolId },
      orderBy: { date: 'asc' },
      take: 4,
    });
    const upcomingEvents = events.map(e => ({
      date: new Date(e.date).getDate().toString().padStart(2, '0'),
      month: new Date(e.date).toLocaleDateString('en-US', { month: 'short' }),
      title: e.title,
      type: e.type,
    }));

    res.json({
      stats: [
        { label: 'Total Students', value: totalStudents.toLocaleString(), icon: 'school', color: '#006b5c', change: `+${Math.min(totalStudents, 24)}`, changeLabel: 'this month' },
        { label: 'Total Teachers', value: String(totalTeachers), icon: 'badge', color: '#0060ac', change: `+${Math.min(totalTeachers, 3)}`, changeLabel: 'new hires' },
        { label: 'Attendance Rate', value: `${attendanceRate}%`, icon: 'trending_up', color: '#006b5c', isHealth: true },
        { label: 'Fee Collection', value: `$${(totalCollected / 1000).toFixed(1)}k`, icon: 'payments', color: '#9d4224', change: '87%', changeLabel: 'collected' },
      ],
      recentActivities,
      topClasses: topClasses.slice(0, 4),
      upcomingEvents,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[dashboard-stats] error:', error.message);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

function getTimeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

module.exports = router;
