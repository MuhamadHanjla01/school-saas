const express = require('express');
const prisma = require('../prismaClient');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Public endpoint for mobile app to check for updates
router.get('/latest', async (req, res) => {
  try {
    const latest = await prisma.appVersion.findFirst({ orderBy: { createdAt: 'desc' } });
    return res.status(200).json({
      latest_version: latest?.version || '0.0.0',
      force_update: latest?.forceUpdate || false,
      download_url: latest?.downloadUrl || null,
      release_notes: latest?.releaseNotes || '',
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

    if (typeof version !== 'string' || !/^\d+\.\d+\.\d+(?:\+\d+)?$/.test(version) || typeof downloadUrl !== 'string' || !/^https:\/\//.test(downloadUrl) || (forceUpdate !== undefined && typeof forceUpdate !== 'boolean')) {
      return res.status(400).json({ error: 'A semantic version, HTTPS download URL and boolean forceUpdate are required' });
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
