/**
 * Tenant Middleware — extracts schoolId from JWT and attaches to request.
 * 
 * Must be applied AFTER verifyToken middleware.
 * SuperAdmin users can optionally pass x-school-id header to access any school.
 */

const resolveTenant = (req, res, next) => {
  // SuperAdmin can override via header
  if (req.user?.role === 'SuperAdmin') {
    req.schoolId = req.headers['x-school-id'] || req.user.schoolId;
    return next();
  }

  // Normal users: schoolId comes from JWT
  if (!req.user?.schoolId) {
    return res.status(403).json({ error: 'Tenant context missing. Please re-authenticate.' });
  }

  req.schoolId = req.user.schoolId;
  next();
};

module.exports = { resolveTenant };
