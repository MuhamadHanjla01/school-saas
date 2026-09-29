const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../prismaClient');

const passwordVersion = (hash) => crypto.createHash('sha256').update(hash).digest('hex');

async function authenticateToken(token) {
  const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET, { algorithms: ['HS256'] });
  if (!decoded || decoded.tokenType !== 'access' || typeof decoded.userId !== 'string') throw new Error('Invalid access token');
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    include: { school: true, student: { select: { id: true, schoolId: true, classId: true } }, teacher: { select: { id: true, schoolId: true } } },
  });
  if (!user || !user.school?.isActive || user.schoolId !== decoded.schoolId || passwordVersion(user.passwordHash) !== decoded.passwordVersion) throw new Error('Session is no longer valid');
  if ((user.student && user.student.schoolId !== user.schoolId) || (user.teacher && user.teacher.schoolId !== user.schoolId)) throw new Error('Invalid school profile');
  return { userId: user.id, email: user.email, role: user.role, schoolId: user.schoolId, schoolName: user.school.name, studentId: user.student?.id || null, teacherId: user.teacher?.id || null, classId: user.student?.classId || null, exp: decoded.exp };
}

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    req.user = await authenticateToken(token);
    next();
  } catch (error) {
    if (error.code?.startsWith('P') || error.name?.includes('Prisma') || /Circuit|timed out|Concurrency/.test(error.message || '')) return res.status(503).json({ error: 'Authentication service temporarily unavailable' });
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
};

module.exports = { verifyToken, checkRole, authenticateToken, passwordVersion };
