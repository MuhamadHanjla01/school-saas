const express = require('express');
const router = express.Router();
const { secureRouter, validateRequestReferences, requireRecord, ADMIN_ROLES, STAFF_ROLES, safeUserSelect, studentScope, classScope, noProfileId } = require('../middleware/routeSecurity');
secureRouter(router, { model: 'certificate', readRoles: ADMIN_ROLES });
const prisma = require('../prismaClient');

// Get all certificates
router.get('/', async (req, res) => {
  try {
    const certificates = await prisma.certificate.findMany({
      where: { schoolId: req.schoolId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(certificates.map(record => ({ ...record, issueDate: record.date })));
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
        date: issueDate ? new Date(issueDate) : new Date(),
        status: status || 'Issued',
        schoolId: req.schoolId
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
    await prisma.certificate.delete({ where: { id: req.params.id, schoolId: req.schoolId } });
    res.json({ message: 'Certificate deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete certificate' });
  }
});

module.exports = router;
