const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.get('/me', verifyToken, authController.me);
router.put('/me', verifyToken, authController.updateMe);
router.post('/change-password', verifyToken, authController.changePassword);

module.exports = router;
