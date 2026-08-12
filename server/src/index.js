require('dotenv').config();
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
const appUpdateRoutes = require('./routes/appUpdateRoutes');
const tenantRoutes = require('./routes/tenantRoutes');
const { verifyToken } = require('./middleware/authMiddleware');
const { resolveTenant } = require('./middleware/tenantMiddleware');
const { authLimiter, apiLimiter } = require('./middleware/rateLimiter');
const helmet = require('helmet');
const { dbBreaker } = require('./prismaClient');
const { cache } = require('./responseCache');

const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Setup Socket.io
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  }
});

// Make io globally available to routes
app.set('io', io);

// Track userId -> Set<socketId> mapping for targeted messaging
const userSockets = new Map();
io.userSockets = userSockets;

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  
  // Client sends 'join' with their userId after connecting
  socket.on('join', (userId) => {
    if (!userId) return;
    socket.userId = userId;
    // Join a room named after the userId for easy targeted emit
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined room user_${userId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
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

app.use(cors({
  origin: true, // You may want to restrict this in production (e.g., origin: process.env.VITE_API_URL || 'http://localhost:5173')
  credentials: true
}));
app.use(helmet()); // Add security headers
app.use(express.json());
app.use(cookieParser());

// Apply global rate limiting
app.use('/api/', apiLimiter);

// ── Auth routes (no tenant required) ──
app.use('/api/auth', authLimiter, authRoutes);

// ── Protected routes: verify token + resolve tenant ──
app.use('/api/students', verifyToken, resolveTenant, studentRoutes);
app.use('/api/teachers', verifyToken, resolveTenant, teacherRoutes);
app.use('/api/classes', verifyToken, resolveTenant, classRoutes);
app.use('/api/attendance', verifyToken, resolveTenant, attendanceRoutes);
app.use('/api/assignments', verifyToken, resolveTenant, assignmentRoutes);
app.use('/api/exams', verifyToken, resolveTenant, examRoutes);
app.use('/api/fees', verifyToken, resolveTenant, feeRoutes);
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
app.use('/api/app-update', appUpdateRoutes);
app.use('/api/superadmin/tenants', verifyToken, tenantRoutes);

// ── Health check ──
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

app.get('/api/health/circuits', (req, res) => {
  res.json({ circuits: [dbBreaker.getStatus()], timestamp: new Date().toISOString() });
});

app.get('/api/health/cache', (req, res) => {
  res.json({ cache: cache.getStats(), timestamp: new Date().toISOString() });
});

app.post('/api/admin/cache/invalidate', (req, res) => {
  const { tag } = req.body;
  if (tag) {
    const count = cache.invalidateByTag(tag);
    return res.json({ message: `Invalidated ${count} entries for tag "${tag}"` });
  }
  const count = cache.invalidateAll();
  res.json({ message: `Invalidated all ${count} entries` });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
