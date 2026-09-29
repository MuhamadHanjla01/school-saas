require('dotenv').config({ path: require('path').join(__dirname, '../.env'), quiet: true });
const express = require('express');
const path = require('path');
const cors = require('cors');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const classRoutes = require('./routes/classRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const examRoutes = require('./routes/examRoutes');
const feeRoutes = require('./routes/feeRoutes');
const communicationRoutes = require('./routes/communicationRoutes');
const timetableRoutes = require('./routes/timetableRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const staffRoutes = require('./routes/staffRoutes');
const parentRoutes = require('./routes/parentRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
const userRoutes = require('./routes/userRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const libraryRoutes = require('./routes/libraryRoutes');
const laboratoryRoutes = require('./routes/laboratoryRoutes');
const healthRoutes = require('./routes/healthRoutes');
const transportRoutes = require('./routes/transportRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const reportRoutes = require('./routes/reportRoutes');
const stripeRoutes = require('./routes/stripeRoutes');
const regionalPaymentRoutes = require('./routes/regionalPaymentRoutes');
const appUpdateRoutes = require('./routes/appUpdateRoutes');
const tenantRoutes = require('./routes/tenantRoutes');
const { verifyToken, checkRole } = require('./middleware/authMiddleware');
const { resolveTenant } = require('./middleware/tenantMiddleware');
const { authLimiter, apiLimiter } = require('./middleware/rateLimiter');
const helmet = require('helmet');
const { dbBreaker } = require('./prismaClient');
const { cache } = require('./responseCache');

const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
if (process.env.TRUST_PROXY_HOPS) app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS));

const allowedOrigins = new Set([
  ...(process.env.CORS_ORIGINS || process.env.APP_URL || '').split(',').map(value => value.trim()).filter(Boolean).map(value => new URL(value).origin),
  ...(process.env.NODE_ENV === 'production' ? [] : ['http://localhost:5173', 'http://127.0.0.1:5173']),
]);
const corsOptions = {
  origin(origin, callback) {
    callback(null, !origin || allowedOrigins.has(origin));
  },
  credentials: true,
};

// Setup Socket.io
const io = new Server(server, {
  cors: corsOptions,
});

// Make io globally available to routes
app.set('io', io);

// Track userId -> Set<socketId> mapping for targeted messaging
const userSockets = new Map();
io.userSockets = userSockets;

io.use((socket, next) => {
  const suppliedToken = socket.handshake.headers.authorization || socket.handshake.auth?.token;
  const authorization = typeof suppliedToken === 'string'
    ? (suppliedToken.startsWith('Bearer ') ? suppliedToken : `Bearer ${suppliedToken}`) : '';
  const request = { headers: { authorization } };
  const response = { status() { return this; }, json() { next(new Error('Unauthorized')); } };
  Promise.resolve(verifyToken(request, response, () => {
    socket.authUser = request.user;
    next();
  })).catch(() => next(new Error('Unauthorized')));
});

io.on('connection', (socket) => {
  const user = socket.authUser;
  socket.userId = user.userId;
  socket.join(`user_${user.userId}`);
  socket.join(`school_${user.schoolId}`);
  socket.join(`school_${user.schoolId}_role_${user.role}`);
  // Older mobile clients send this event. It can never select another identity.
  socket.on('join', (userId) => {
    if (userId === user.userId) socket.join(`user_${user.userId}`);
  });
  if (!userSockets.has(user.userId)) userSockets.set(user.userId, new Set());
  userSockets.get(user.userId).add(socket.id);
  const expiry = setTimeout(() => socket.disconnect(true), Math.max(0, (user.exp || 0) * 1000 - Date.now()));
  expiry.unref();
  socket.on('disconnect', () => {
    clearTimeout(expiry);
    userSockets.get(user.userId)?.delete(socket.id);
    if (!userSockets.get(user.userId)?.size) userSockets.delete(user.userId);
  });
});

// ── Global request timeout (10s) ──
app.use((req, res, next) => {
  req.setTimeout(10_000, () => {
    if (!res.headersSent) {
      res.status(504).json({ error: 'Request timed out' });
    }
  });
  next();
});

// Enable gzip/deflate compression
app.use(compression({
  threshold: 512,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));

app.use(cors(corsOptions));
app.use(helmet({ contentSecurityPolicy: { directives: { 'img-src': ["'self'", 'data:', 'blob:', 'https:'], 'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'], 'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'], 'connect-src': ["'self'", 'wss:', 'ws:'] } } })); // Add security headers
// Signature verification needs exactly the bytes Stripe sent, before JSON parsing.
app.post('/api/stripe/webhook', express.raw({ type: 'application/json', limit: '1mb' }), (req, res, next) => stripeRoutes.webhookHandler(req, res, next));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Apply global rate limiting
app.use('/api/', apiLimiter);

app.use('/api', (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });

// ── Auth routes (no tenant required) ──
app.use(['/api/auth/login', '/api/auth/forgot-password', '/api/auth/reset-password'], authLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/public', require('./routes/publicRoutes'));

// ── Protected routes: verify token + resolve tenant ──
app.use('/api/students', verifyToken, resolveTenant, studentRoutes);
app.use('/api/teachers', verifyToken, resolveTenant, teacherRoutes);
app.use('/api/classes', verifyToken, resolveTenant, classRoutes);
app.use('/api/attendance', verifyToken, resolveTenant, attendanceRoutes);
app.use('/api/assignments', verifyToken, resolveTenant, assignmentRoutes);
app.use('/api/exams', verifyToken, resolveTenant, examRoutes);
app.use('/api/fees', verifyToken, resolveTenant, feeRoutes);
app.use('/api/school-admin', verifyToken, resolveTenant, require('./routes/schoolAdminRoutes'));
app.use('/api/education', verifyToken, resolveTenant, require('./routes/educationRoutes'));
app.use('/api/school', verifyToken, resolveTenant, communicationRoutes);
app.use('/api/timetable', verifyToken, resolveTenant, timetableRoutes);
app.use('/api/subjects', verifyToken, resolveTenant, subjectRoutes);
app.use('/api/staff', verifyToken, resolveTenant, staffRoutes);
app.use('/api/parents', verifyToken, resolveTenant, parentRoutes);
app.use('/api/audit-logs', verifyToken, resolveTenant, auditLogRoutes);
app.use('/api/users', verifyToken, resolveTenant, userRoutes);
app.use('/api/notifications', verifyToken, resolveTenant, notificationRoutes);
app.use('/api/library', verifyToken, resolveTenant, libraryRoutes);
app.use('/api/laboratory', verifyToken, resolveTenant, laboratoryRoutes);
app.use('/api/health-records', verifyToken, resolveTenant, healthRoutes);
app.use('/api/transport', verifyToken, resolveTenant, transportRoutes);
app.use('/api/certificates', verifyToken, resolveTenant, certificateRoutes);
app.use('/api/reports', verifyToken, resolveTenant, reportRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/payments', verifyToken, resolveTenant, regionalPaymentRoutes);
app.use('/api/app-update', appUpdateRoutes);
app.use('/api/superadmin/tenants', verifyToken, tenantRoutes);
app.use('/api/platform', verifyToken, require('./routes/platformRoutes'));

// ── Health check ──
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/health/ready', async (req, res) => {
  try { await require('./prismaClient').$queryRaw`SELECT 1`; res.json({ status: 'ready' }); }
  catch { res.status(503).json({ status: 'unavailable' }); }
});

// Serve static uploads
app.use('/uploads', express.static(process.env.UPLOAD_DIR || path.join(__dirname, '../public/uploads')));

app.get('/api/health/circuits', verifyToken, checkRole(['SuperAdmin']), (req, res) => {
  res.json({ circuits: [dbBreaker.getStatus()], timestamp: new Date().toISOString() });
});

app.get('/api/health/cache', verifyToken, checkRole(['SuperAdmin']), (req, res) => {
  res.json({ cache: cache.getStats(), timestamp: new Date().toISOString() });
});

app.post('/api/admin/cache/invalidate', verifyToken, checkRole(['SuperAdmin']), (req, res) => {
  const { tag } = req.body;
  if (tag) {
    const count = cache.invalidateByTag(tag);
    return res.json({ message: `Invalidated ${count} entries for tag "${tag}"` });
  }
  const count = cache.invalidateAll();
  res.json({ message: `Invalidated all ${count} entries` });
});

app.use('/api', (req, res) => res.status(404).json({ error: 'Endpoint not found' }));
if (process.env.NODE_ENV === 'production' || process.env.SERVE_CLIENT === 'true') {
  const clientPath = path.join(__dirname, '../../dist');
  app.use(express.static(clientPath, { index: false, maxAge: '1h' }));
  app.get('/{*path}', (req, res) => res.set('Cache-Control', 'no-cache').sendFile(path.join(clientPath, 'index.html')));
}
app.use(require('./services/adminValidation').errorHandler);

if (require.main === module) {
  if (!process.env.DATABASE_URL || !(process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET) || !(process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET)) {
    throw new Error('Set DATABASE_URL and JWT signing secrets before starting the server. See server/.env.example.');
  }
  if (process.env.NODE_ENV === 'production' && !process.env.APP_URL) throw new Error('APP_URL is required in production.');
  if (process.env.NODE_ENV === 'production') {
    for (const secret of [process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET]) {
      if (secret.length < 32 || secret.startsWith('replace-with')) throw new Error('Production JWT signing secrets must be at least 32 characters.');
    }
    if (!process.env.APP_URL.startsWith('https://')) throw new Error('Production APP_URL must use HTTPS.');
  }
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
  const shutdown = () => {
    const deadline = setTimeout(() => process.exit(1), 10000); deadline.unref();
    io.close(() => { server.close(async () => { await require('./prismaClient').$disconnect(); clearTimeout(deadline); process.exit(0); }); });
  };
  process.once('SIGTERM', shutdown); process.once('SIGINT', shutdown);
}
module.exports = { app, server, io };
