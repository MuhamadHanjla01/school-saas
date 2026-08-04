const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');

// Get all certificates
router.get('/', async (req, res) => {
  try {
    const certificates = await prisma.certificate.findMany({
      where: { schoolId: req.tenant.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(certificates);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
});

// Create a certificate
router.post('/', async (req, res) => {
  try {
    const { studentName, type, issueDate, status } = req.body;
    const certificate = await prisma.certificate.create({
      data: {
        certId: `CERT-${Date.now()}`,
        studentName,
        type,
        issueDate: issueDate ? new Date(issueDate) : new Date(),
        status: status || 'Issued',
        schoolId: req.tenant.id
      }
    });
    res.status(201).json(certificate);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save certificate' });
  }
});

// Delete certificate
router.delete('/:id', async (req, res) => {
  try {
    await prisma.certificate.delete({ where: { id: req.params.id } });
    res.json({ message: 'Certificate deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete certificate' });
  }
});

module.exports = router;
