const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const { dbCall } = require('../prismaClient');

router.get('/', async (req, res) => {
  try {
    const schoolId = req.schoolId;
    const userId = req.user.userId;
    const role = req.user.role;

    // We will aggregate notifications from Notices, Messages, and Assignments
    let notifications = [];

    // 1. Fetch recent Notices (last 10)
    const notices = await dbCall(() => prisma.notice.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }));
    notices.forEach(notice => {
      notifications.push({
        id: `notice_${notice.id}`,
        type: 'Notice',
        title: notice.title,
        description: notice.content,
        date: notice.createdAt,
        isRead: true, // We could implement read tracking later
      });
    });

    // 2. Fetch recent Messages for this user (last 10)
    const messages = await dbCall(() => prisma.message.findMany({
      where: { schoolId, receiverId: userId },
      include: {
        sender: { select: { email: true, teacher: { select: { name: true } }, student: { select: { name: true } } } }
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }));
    messages.forEach(msg => {
      const senderName = msg.sender.teacher?.name || msg.sender.student?.name || msg.sender.email;
      notifications.push({
        id: `msg_${msg.id}`,
        type: 'Message',
        title: `Message from ${senderName}`,
        description: msg.content,
        date: msg.createdAt,
        isRead: msg.read,
      });
    });

    // 3. Fetch recent Assignments
    // If Student: fetch assignments for their class.
    // If Teacher: fetch assignments they created.
    if (role === 'Student') {
      const student = await dbCall(() => prisma.student.findUnique({
        where: { studentId: req.user.studentId || userId },
      }));
      // If student is linked correctly and has classId
      // Fallback: search by user -> student
      const actualStudent = await dbCall(() => prisma.student.findFirst({
        where: { id: req.user.studentId }
      }));

      if (actualStudent && actualStudent.classId) {
        const assignments = await dbCall(() => prisma.assignment.findMany({
          where: { schoolId, classId: actualStudent.classId },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }));
        assignments.forEach(assgn => {
          notifications.push({
            id: `assgn_${assgn.id}`,
            type: 'Assignment',
            title: `New Assignment: ${assgn.title}`,
            description: `Due Date: ${new Date(assgn.dueDate).toLocaleDateString()}`,
            date: assgn.createdAt,
            isRead: true,
          });
        });
      }
    } else if (role === 'Teacher') {
      const actualTeacher = await dbCall(() => prisma.teacher.findFirst({
        where: { id: req.user.teacherId }
      }));
      if (actualTeacher) {
        const assignments = await dbCall(() => prisma.assignment.findMany({
          where: { schoolId, teacherId: actualTeacher.id },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }));
        assignments.forEach(assgn => {
          notifications.push({
            id: `assgn_${assgn.id}`,
            type: 'Assignment',
            title: `Assignment Created: ${assgn.title}`,
            description: `Due Date: ${new Date(assgn.dueDate).toLocaleDateString()}`,
            date: assgn.createdAt,
            isRead: true,
          });
        });
      }
    }

    // Sort all aggregated notifications by date, newest first
    notifications.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Limit to top 30 overall
    notifications = notifications.slice(0, 30);

    res.json({ notifications });
  } catch (error) {
    console.error('[notifications] GET error:', error.message);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

module.exports = router;
