const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const { dbCall } = require('../prismaClient');

// GET /api/notifications
// Fetch notifications for the authenticated user
router.get('/', async (req, res) => {
  try {
    const schoolId = req.schoolId;
    const userId = req.user.userId;

    const notifications = await dbCall(() => prisma.notification.findMany({
      where: { schoolId, userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }));

    // Transform for the frontend
    const formatted = notifications.map(n => ({
      id: n.id,
      type: n.type,
      title: n.title,
      description: n.message,
      date: n.createdAt,
      isRead: n.isRead,
    }));

    res.json({ notifications: formatted });
  } catch (error) {
    console.error('[notifications] GET error:', error.message);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// POST /api/notifications/read
// Mark specific, list, or all notifications as read
router.post('/read', async (req, res) => {
  try {
    const schoolId = req.schoolId;
    const userId = req.user.userId;
    const { notificationId, notificationIds } = req.body;

    if (Array.isArray(notificationIds) && notificationIds.length > 0) {
      await dbCall(() => prisma.notification.updateMany({
        where: { id: { in: notificationIds }, schoolId, userId },
        data: { isRead: true },
      }));
    } else if (notificationId) {
      await dbCall(() => prisma.notification.updateMany({
        where: { id: notificationId, schoolId, userId },
        data: { isRead: true },
      }));
    } else {
      // Mark all as read
      await dbCall(() => prisma.notification.updateMany({
        where: { schoolId, userId, isRead: false },
        data: { isRead: true },
      }));
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[notifications] Mark Read error:', error.message);
    res.status(500).json({ error: 'Failed to update notification status' });
  }
});

// DELETE /api/notifications — clear all notifications for user
router.delete('/', async (req, res) => {
  try {
    const schoolId = req.schoolId;
    const userId = req.user.userId;

    await dbCall(() => prisma.notification.deleteMany({
      where: { schoolId, userId },
    }));

    res.json({ success: true, message: 'All notifications cleared' });
  } catch (error) {
    console.error('[notifications] DELETE error:', error.message);
    res.status(500).json({ error: 'Failed to clear notifications' });
  }
});

module.exports = router;
