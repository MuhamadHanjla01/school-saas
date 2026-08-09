const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prismaClient');
const { dbCall } = require('../prismaClient');

const generateAccessToken = (user, school = null) => {
  return jwt.sign(
    { userId: user.id, role: user.role, schoolId: user.schoolId, schoolName: school?.name || 'iNiLabs School' },
    process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { userId: user.id, schoolId: user.schoolId },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

exports.login = async (req, res) => {
  try {
    const { email, password, clientType } = req.body;
    const user = await dbCall(() => prisma.user.findUnique({
      where: { email },
      include: {
        student: { include: { class: true } },
        teacher: true
      }
    }));

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if school is active
    const school = await dbCall(() => prisma.school.findUnique({ where: { id: user.schoolId } }));
    if (!school || !school.isActive) {
      return res.status(403).json({ error: 'School account is deactivated. Contact support.' });
    }

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
    res.status(500).json({ error: 'Internal server error', details: error.message, stack: error.stack });
  }
};

exports.refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!refreshToken) return res.status(401).json({ error: 'No refresh token' });

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    } catch (e) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }

    const user = await dbCall(() => prisma.user.findUnique({ where: { id: decoded.userId } }));
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }

    const school = await dbCall(() => prisma.school.findUnique({ where: { id: user.schoolId } }));

    const newAccessToken = generateAccessToken(user, school);
    const newRefreshToken = generateRefreshToken(user);

    await dbCall(() => prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken }
    }));

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    if (error.message?.includes('Circuit is OPEN') || error.message?.includes('timed out')) {
      return res.status(503).json({ error: 'Service temporarily unavailable.' });
    }
    console.error('[refresh]', error);
    res.status(500).json({ error: 'Internal server error', details: error.message, stack: error.stack });
  }
};

exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (refreshToken) {
      await dbCall(() => prisma.user.updateMany({
        where: { refreshToken },
        data: { refreshToken: null }
      }));
    }
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    if (error.message?.includes('Circuit is OPEN') || error.message?.includes('timed out')) {
      res.clearCookie('refreshToken');
      return res.json({ message: 'Logged out (session cleanup pending)' });
    }
    console.error('[logout]', error);
    res.status(500).json({ error: 'Internal server error', details: error.message, stack: error.stack });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await dbCall(() => prisma.user.findUnique({ where: { email } }));
    if (!user) return res.json({ message: 'If that email exists, a password reset link has been sent.' });

    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    await dbCall(() => prisma.passwordResetToken.create({
      data: {
        token,
        expiresAt,
        userId: user.id
      }
    }));

    // TODO: Send email with token here. For now just log it.
    console.log(`Password reset token for ${email}: ${token}`);

    res.json({ message: 'If that email exists, a password reset link has been sent.' });
  } catch (error) {
    console.error('[forgotPassword]', error);
    res.status(500).json({ error: 'Internal server error', details: error.message, stack: error.stack });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ error: 'Token and new password required' });

    const resetToken = await dbCall(() => prisma.passwordResetToken.findUnique({ where: { token } }));
    if (!resetToken || resetToken.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await dbCall(() => prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash }
    }));

    await dbCall(() => prisma.passwordResetToken.deleteMany({
      where: { userId: resetToken.userId }
    }));

    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('[resetPassword]', error);
    res.status(500).json({ error: 'Internal server error', details: error.message, stack: error.stack });
  }
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
        student: { select: { id: true, name: true, studentId: true, class: { select: { name: true } } } },
        school: { select: { id: true, name: true, slug: true, logo: true, plan: true } }
      }
    }));
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (error) {
    if (error.message?.includes('Circuit is OPEN') || error.message?.includes('timed out')) {
      return res.status(503).json({ error: 'Service temporarily unavailable.' });
    }
    res.status(500).json({ error: 'Internal server error', details: error.message, stack: error.stack });
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
    if (user.avatar && user.avatar.startsWith('/uploads/')) {
      const fs = require('fs');
      const path = require('path');
      const oldPath = path.join(__dirname, '../../public', user.avatar);
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
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both passwords required' });

    const user = await dbCall(() => prisma.user.findUnique({ where: { id: req.user.userId } }));
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) return res.status(401).json({ error: 'Current password is incorrect' });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await dbCall(() => prisma.user.update({
      where: { id: req.user.userId },
      data: { passwordHash }
    }));

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('[changePassword]', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};
