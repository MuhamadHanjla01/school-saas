const express = require('express');
const router = express.Router();
const { secureRouter, validateRequestReferences, requireRecord, ADMIN_ROLES, STAFF_ROLES, safeUserSelect, studentScope, classScope, noProfileId } = require('../middleware/routeSecurity');
secureRouter(router, { model: 'notice', messages: true });
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
    if (!ADMIN_ROLES.includes(req.user.role)) where.audience = { in: ['All', req.user.role, `${req.user.role}s`] };

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
      const role = { Students: 'Student', Teachers: 'Teacher', Parents: 'Parent', Staff: 'Staff' }[notice.audience] || notice.audience;
      io.to(notice.audience === 'All' ? `school_${req.schoolId}` : `school_${req.schoolId}_role_${role}`).emit('new_notice', notice);
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
      where: { id: req.params.id, schoolId: req.schoolId },
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
    await dbCall(() => prisma.notice.delete({ where: { id: req.params.id, schoolId: req.schoolId } }));
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

router.put('/events/:eventId', checkRole(ADMIN_ROLES), async (req, res) => {
  await requireRecord(req, 'event', req.params.eventId);
  const data = require('../services/adminValidation').validate([ {name:'title',label:'Title',required:true}, {name:'date',label:'Date',type:'date',required:true}, {name:'type',label:'Type',type:'select',options:['event','holiday','exam','deadline'],default:'event'} ], req.body);
  res.json({event:await prisma.event.update({where:{id:req.params.eventId,schoolId:req.schoolId},data})});
});
router.delete('/events/:eventId', checkRole(ADMIN_ROLES), async (req,res)=>{
  await requireRecord(req,'event',req.params.eventId);
  await prisma.event.delete({where:{id:req.params.eventId,schoolId:req.schoolId}});res.json({success:true});
});

// ─── Timetable ─────────────────────────────────────────────────────────────────

// GET /api/timetable — get timetable
router.get('/timetable', async (req, res) => {
  try {
    const { classId, teacherId } = req.query;
    const where = { schoolId: req.schoolId };
    if (classId) where.classId = classId;
    if (teacherId) where.teacherId = teacherId;
    Object.assign(where, classScope(req));

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
      senderName: m.sender?.teacher?.name || m.sender?.student?.name || m.sender?.email || 'Unknown',
      receiverName: m.receiver?.teacher?.name || m.receiver?.student?.name || m.receiver?.email || 'Unknown',
    }));

    res.json({ messages: formatted });
  } catch (error) {
    console.error('[messages] GET error:', error.message);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// GET /api/messages/unread-count — get unread message count for current user
router.get('/messages/unread-count', async (req, res) => {
  try {
    const userId = req.user.userId;
    const count = await dbCall(() => prisma.message.count({
      where: {
        schoolId: req.schoolId,
        receiverId: userId,
        read: false,
      },
    }));
    res.json({ unreadCount: count });
  } catch (error) {
    console.error('[messages] unread-count error:', error.message);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// PUT /api/messages/read — mark messages as read for a conversation
router.put('/messages/read', async (req, res) => {
  try {
    const { senderId } = req.body;
    const userId = req.user.userId;

    if (!senderId) return res.status(400).json({ error: 'senderId required' });

    const result = await dbCall(() => prisma.message.updateMany({
      where: {
        schoolId: req.schoolId,
        senderId: senderId,
        receiverId: userId,
        read: false,
      },
      data: { read: true },
    }));

    // Notify the sender that their messages have been read
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${senderId}`).emit('messages_read', {
        readBy: userId,
        senderId: senderId,
      });
    }

    res.json({ success: true, updatedCount: result.count });
  } catch (error) {
    console.error('[messages] mark-read error:', error.message);
    res.status(500).json({ error: 'Failed to mark messages as read' });
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

    const [senderUser, receiverUser] = await Promise.all([
      prisma.user.findUnique({
        where: { id: req.user.userId },
        include: { teacher: true, student: true }
      }),
      prisma.user.findUnique({
        where: { id: receiverId },
        include: { teacher: true, student: true }
      }),
    ]);
    const senderName = senderUser?.teacher?.name || senderUser?.student?.name || senderUser?.email || 'Someone';
    const receiverName = receiverUser?.teacher?.name || receiverUser?.student?.name || receiverUser?.email || 'Unknown';

    await prisma.notification.create({
      data: {
        title: `Message from ${senderName}`,
        message: content,
        type: 'Message',
        userId: receiverId,
        schoolId: req.schoolId,
      },
    });

    const io = req.app.get('io');
    if (io) {
      const messagePayload = {
        ...message,
        senderName,
        receiverName,
      };
      // Emit ONLY to receiver's room — sender never receives their own message socket event
      io.to(`user_${receiverId}`).emit('new_message', messagePayload);
    }

    res.status(201).json({ message });
  } catch (error) {
    console.error('[messages] POST error:', error.message);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// ─── Salary ────────────────────────────────────────────────────────────────────

// GET /api/salary — teacher's own salary
router.get('/salary', checkRole(['Teacher']), async (req, res) => {
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
router.get('/dashboard-stats', checkRole(ADMIN_ROLES), async (req, res) => { res.json(await require('../services/schoolAnalytics').schoolAnalytics(req.schoolId)); });

module.exports = router;
