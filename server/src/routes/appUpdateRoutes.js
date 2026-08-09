const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();
const prisma = new PrismaClient();

// Public endpoint for mobile app to check for updates
router.get('/latest', async (req, res) => {
  try {
    const latestVersion = await prisma.appVersion.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (!latestVersion) {
      return res.status(200).json({
        latest_version: '0.0.0',
        force_update: false,
        download_url: '',
        release_notes: 'No updates available',
      });
    }

    res.status(200).json({
      latest_version: latestVersion.version,
      force_update: latestVersion.forceUpdate,
      download_url: latestVersion.downloadUrl,
      release_notes: latestVersion.releaseNotes,
    });
  } catch (error) {
    console.error('Error fetching latest app version:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Secure endpoint to get update history
router.get('/', verifyToken, async (req, res) => {
  try {
    // Only superadmin should access this, but we'll check role if needed.
    if (req.user.role !== 'SuperAdmin' && req.user.role !== 'SUPERADMIN') {
       return res.status(403).json({ error: 'Forbidden' });
    }

    const versions = await prisma.appVersion.findMany({
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json(versions);
  } catch (error) {
    console.error('Error fetching app versions:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Secure endpoint to release a new version
router.post('/', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'SuperAdmin' && req.user.role !== 'SUPERADMIN') {
       return res.status(403).json({ error: 'Forbidden' });
    }

    const { version, forceUpdate, downloadUrl, releaseNotes } = req.body;

    if (!version || !downloadUrl) {
      return res.status(400).json({ error: 'Version and downloadUrl are required' });
    }

    const newVersion = await prisma.appVersion.create({
      data: {
        version,
        forceUpdate: forceUpdate || false,
        downloadUrl,
        releaseNotes,
      },
    });

    res.status(201).json({ message: 'Version released successfully', version: newVersion });
  } catch (error) {
    console.error('Error releasing new app version:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
