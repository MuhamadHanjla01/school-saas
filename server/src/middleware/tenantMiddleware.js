/**
 * Tenant Middleware — extracts schoolId from JWT and attaches to request.
 * 
 * Must be applied AFTER verifyToken middleware.
 * SuperAdmin users can optionally pass x-school-id header to access any school.
 */

const prisma = require('../prismaClient');
const resolveTenant = async (req, res, next) => {
  // SuperAdmin can override via header
  if (req.user?.role === 'SuperAdmin') {
    const schoolId = req.headers['x-school-id'] || req.user.schoolId;
    if (typeof schoolId !== 'string' || !schoolId.trim()) return res.status(403).json({ error: 'School context is required' });
    try {
      const school = await prisma.school.findUnique({ where: { id: schoolId }, select: { id: true, isActive: true } });
      if (!school || !school.isActive) return res.status(403).json({ error: 'School is unavailable' });
      req.schoolId = school.id;
      return next();
    } catch (error) { return res.status(503).json({ error: 'Unable to resolve school context' }); }
  }

  // Normal users: schoolId comes from JWT
  if (!req.user?.schoolId) {
    return res.status(403).json({ error: 'Tenant context missing. Please re-authenticate.' });
  }

  req.schoolId = req.user.schoolId;
  next();
};

module.exports = { resolveTenant };
