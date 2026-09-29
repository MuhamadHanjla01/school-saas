const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prismaClient');
const { dbCall } = require('../prismaClient');
const crypto = require('crypto');
const { passwordVersion } = require('../middleware/authMiddleware');
const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: 7 * 24 * 60 * 60 * 1000 };
const validPasswordInput = (password) => typeof password === 'string' && password.length >= 8 && Buffer.byteLength(password, 'utf8') <= 72;

const generateAccessToken = (user, school = null) => {
  return jwt.sign(
    { userId: user.id, role: user.role, schoolId: user.schoolId, schoolName: school?.name, tokenType: 'access', passwordVersion: passwordVersion(user.passwordHash) },
    process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { userId: user.id, schoolId: user.schoolId, tokenType: 'refresh' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: '7d', jwtid: crypto.randomUUID() }
  );
};

exports.login = async (req, res) => {
  try {
    const { password, clientType } = req.body || {};
    if (typeof req.body?.email !== 'string' || typeof password !== 'string' || !password || Buffer.byteLength(password, 'utf8') > 72) return res.status(400).json({ error: 'Email and password are required' });
    const email = req.body.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        school: true,
        student: { include: { class: true } },
        teacher: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if school is active
    const school = await dbCall(() => prisma.school.findUnique({ where: { id: user.schoolId } }));
    if (!school || !school.isActive) {
      return res.status(403).json({ error: 'School account is deactivated. Contact support.' });
    }
    if ((user.student && user.student.schoolId !== user.schoolId) || (user.teacher && user.teacher.schoolId !== user.schoolId)) return res.status(403).json({ error: 'Account profile belongs to a different school. Contact your administrator.' });
    if (user.role === 'Student' && !user.student) return res.status(403).json({ error: 'Student account is not linked to a student profile. Contact your administrator.' });
    if ((req.body.schoolId && req.body.schoolId !== school.id) || (req.body.schoolSlug && req.body.schoolSlug !== school.slug)) return res.status(403).json({ error: 'This account belongs to a different school' });

    // Platform Restrictions
    if (clientType === 'app') {
      if (user.role === 'SuperAdmin' || user.role === 'SchoolAdmin') {
        return res.status(403).json({ error: 'Access Denied: Administrators must use the Web Dashboard.' });
      }
    }

    const accessToken = generateAccessToken(user, school);
    const refreshToken = generateRefreshToken(user);

    await dbCall(() => prisma.user.update({
      where: { id: user.id },
      data: { refreshToken, lastLoginAt: new Date() }
    }));

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      accessToken,
      refreshToken, // Send to mobile app
      user: {
        id: user.id, email: user.email, role: user.role, schoolId: user.schoolId, name: user.name,
        student: user.student, teacher: user.teacher
      },
      school: { id: school.id, name: school.name, slug: school.slug, logo: school.logo, plan: school.plan }
    });
  } catch (error) {
    if (error.message?.includes('Circuit is OPEN') || error.message?.includes('timed out')) {
      return res.status(503).json({ error: 'Service temporarily unavailable. Please try again shortly.' });
    }
    if (error.message?.includes('Concurrency limit')) {
      return res.status(503).json({ error: 'Server is busy. Please try again in a moment.' });
    }
    console.error('[login]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.refresh = async (req, res) => {
  try {
    const refreshToken = req.body?.refreshToken || req.cookies?.refreshToken;
    if (!refreshToken) return res.status(401).json({ error: 'No refresh token' });

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, { algorithms: ['HS256'] });
      if (decoded.tokenType !== 'refresh' || typeof decoded.userId !== 'string') throw new Error('Invalid refresh token');
    } catch (e) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }

    const user = await dbCall(() => prisma.user.findUnique({ where: { id: decoded.userId } }));
    if (!user || user.refreshToken !== refreshToken || user.schoolId !== decoded.schoolId) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }

    const school = await dbCall(() => prisma.school.findUnique({ where: { id: user.schoolId } }));
    if (!school?.isActive) return res.status(403).json({ error: 'School account is deactivated. Contact support.' });

    const newAccessToken = generateAccessToken(user, school);
    const newRefreshToken = generateRefreshToken(user);

    const rotated = await dbCall(() => prisma.user.updateMany({
      where: { id: user.id, refreshToken },
      data: { refreshToken: newRefreshToken }
    }));
    if (rotated.count !== 1) return res.status(403).json({ error: 'Refresh token has already been used' });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (error) {
    if (error.message?.includes('Circuit is OPEN') || error.message?.includes('timed out')) {
      return res.status(503).json({ error: 'Service temporarily unavailable.' });
    }
    console.error('[refresh]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.logout = async (req, res) => {
  try {
    const refreshToken = req.body?.refreshToken || req.cookies?.refreshToken;
    if (refreshToken) {
      await dbCall(() => prisma.user.updateMany({
        where: { refreshToken },
        data: { refreshToken: null }
      }));
    }
    res.clearCookie('refreshToken', { ...cookieOptions, maxAge: undefined });
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    if (error.message?.includes('Circuit is OPEN') || error.message?.includes('timed out')) {
      res.clearCookie('refreshToken');
      return res.json({ message: 'Logged out (session cleanup pending)' });
    }
    console.error('[logout]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.forgotPassword = async (req, res) => {
  if (!process.env.SMTP_HOST || !process.env.MAIL_FROM || !process.env.APP_URL) return res.status(503).json({ error: 'Email recovery is not configured. Ask your school administrator to reset your password.' });
  try {
    if (typeof req.body?.email !== 'string') return res.status(400).json({ error: 'Email is required' });
    const email = req.body.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      const hash = crypto.createHash('sha256').update(token).digest('hex');
      await prisma.passwordResetToken.create({ data: { token: hash, expiresAt: new Date(Date.now() + 3600000), userId: user.id } });
      const transporter = require('nodemailer').createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: process.env.SMTP_SECURE === 'true', ...(process.env.SMTP_USER ? { auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } } : {}), connectionTimeout: 5000, socketTimeout: 8000 });
      const url = new URL('/reset-password', process.env.APP_URL); url.searchParams.set('token', token);
      try { await transporter.sendMail({ from: process.env.MAIL_FROM, to: email, subject: 'Reset your ERPZO password', text: `Reset your password using this link within one hour: ${url.toString()}\nIf you did not request this, ignore this email.` }); }
      catch (error) { await prisma.passwordResetToken.deleteMany({ where: { token: hash } }); throw error; }
    }
    res.json({ message: 'If that account exists, a password reset link has been sent.' });
  } catch (error) { console.error('[password recovery]', error.code || error.name); res.status(503).json({ error: 'Password recovery is temporarily unavailable. Please contact your administrator.' }); }
};
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body || {};
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token) || !validPasswordInput(newPassword)) return res.status(400).json({ error: 'A valid reset token and password (8-72 bytes) are required' });
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.$transaction(async db => {
      const reset = await db.passwordResetToken.findUnique({ where: { token: hashedToken } });
      if (!reset || reset.expiresAt <= new Date()) throw Object.assign(new Error('Invalid or expired reset token'), { status: 400 });
      await db.passwordResetToken.delete({ where: { id: reset.id } });
      await db.user.update({ where: { id: reset.userId }, data: { passwordHash, refreshToken: null } });
      await db.passwordResetToken.deleteMany({ where: { userId: reset.userId } });
    });
    res.json({ message: 'Password reset. Sign in with your new password.' });
  } catch (error) { res.status(error.status || (error.code === 'P2025' ? 400 : 500)).json({ error: error.status ? error.message : 'Unable to reset password' }); }
};

// GET /api/auth/me — extended profile
exports.me = async (req, res) => {
  try {
    const user = await dbCall(() => prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true, email: true, role: true, name: true, phone: true, avatar: true,
        lastLoginAt: true, createdAt: true, schoolId: true,
        teacher: { select: { id: true, name: true, department: true, employeeId: true } },
        student: { include: { class: true } },
        school: { select: { id: true, name: true, slug: true, logo: true, plan: true } }
      }
    }));
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (error) {
    if (error.message?.includes('Circuit is OPEN') || error.message?.includes('timed out')) {
      return res.status(503).json({ error: 'Service temporarily unavailable.' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /api/auth/me — update profile
exports.updateMe = async (req, res) => {
  try {
    const { name, phone, avatar } = req.body;
    const user = await dbCall(() => prisma.user.update({
      where: { id: req.user.userId },
      data: { name, phone, avatar },
      select: { id: true, email: true, role: true, name: true, phone: true, avatar: true }
    }));
    res.json({ user });
  } catch (error) {
    console.error('[updateMe]', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// POST /api/auth/me/avatar — upload new avatar
exports.updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const user = await dbCall(() => prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { avatar: true }
    }));

    if (!user) return res.status(404).json({ error: 'User not found' });

    // Delete old avatar if it exists and is a local file
    if (user.avatar && /^\/uploads\/[a-zA-Z0-9_.-]+$/.test(user.avatar)) {
      const fs = require('fs');
      const path = require('path');
      const oldPath = path.join(process.env.UPLOAD_DIR || path.join(__dirname, '../../public/uploads'), path.basename(user.avatar));
      if (fs.existsSync(oldPath)) {
        try {
          fs.unlinkSync(oldPath);
        } catch (err) {
          console.error('[updateAvatar] Failed to delete old avatar:', err);
        }
      }
    }

    const avatarUrl = `/uploads/${req.file.filename}`;

    const updatedUser = await dbCall(() => prisma.user.update({
      where: { id: req.user.userId },
      data: { avatar: avatarUrl },
      select: { id: true, email: true, role: true, name: true, phone: true, avatar: true }
    }));

    res.json({ user: updatedUser });
  } catch (error) {
    console.error('[updateAvatar]', error);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
};

// POST /api/auth/change-password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both passwords required' });
    if (!validPasswordInput(newPassword)) return res.status(400).json({ error: 'Password must contain at least 8 characters and at most 72 bytes' });

    const user = await dbCall(() => prisma.user.findUnique({ where: { id: req.user.userId } }));
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) return res.status(401).json({ error: 'Current password is incorrect' });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await dbCall(() => prisma.user.update({
      where: { id: req.user.userId },
      data: { passwordHash, refreshToken: null }
    }));

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('[changePassword]', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};
