const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024, files: 1 }, fileFilter(req, file, cb) { const allowed = ['image/jpeg', 'image/png', 'image/webp']; const ok = allowed.includes(file.mimetype) && ['.jpg', '.jpeg', '.png', '.webp'].includes(path.extname(file.originalname).toLowerCase()); cb(ok ? null : Object.assign(new Error('Only PNG, JPEG and WebP avatars are allowed'), { status: 400 }), ok); } });

router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/me', verifyToken, authController.me);
router.put('/me', verifyToken, authController.updateMe);
router.post('/me/avatar', verifyToken, upload.single('avatar'), authController.updateAvatar);
router.post('/change-password', verifyToken, authController.changePassword);

module.exports = router;
