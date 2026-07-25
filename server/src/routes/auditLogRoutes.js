const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const { dbCall } = require('../prismaClient');
const { checkRole } = require('../middleware/authMiddleware');

// GET /api/audit-logs — paginated, filterable
router.get('/', checkRole(['SchoolAdmin', 'SuperAdmin']), async (req, res) => {
  try {
    const { search, severity, startDate, endDate, page = 1, limit = 30 } = req.query;
    const where = { schoolId: req.schoolId };

    if (search) {
      where.OR = [
        { action: { contains: search } },
        { userName: { contains: search } },
        { entity: { contains: search } },
      ];
    }
    if (severity && severity !== 'All') where.severity = severity;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [logs, total] = await Promise.all([
      dbCall(() => prisma.auditLog.findMany({ where, skip, take: parseInt(limit), orderBy: { createdAt: 'desc' } })),
      dbCall(() => prisma.auditLog.count({ where })),
    ]);

    res.json({ logs, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    console.error('[audit-logs] GET error:', error.message);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

module.exports = router;

/**
 * Helper: Log an audit event. Call from any route handler.
 * Usage: logAudit(req, { action: 'Created Student', entity: 'Student', entityId: student.id, severity: 'Info' })
 */
module.exports.logAudit = async (req, { action, entity, entityId, details, severity }) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        userName: req.user?.email || 'System',
        action,
        entity,
        entityId,
        details: details ? JSON.stringify(details) : null,
        severity: severity || 'Info',
        ipAddress: req.ip || req.connection?.remoteAddress,
        schoolId: req.schoolId || req.user?.schoolId,
      }
    });
  } catch (err) {
    console.error('[auditLog] Failed to write audit log:', err.message);
  }
};
