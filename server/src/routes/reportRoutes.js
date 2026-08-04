const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');

router.get('/dashboard-stats', async (req, res) => {
  try {
    const schoolId = req.schoolId;

    const studentCount = await prisma.student.count({ where: { schoolId } });
    const teacherCount = await prisma.teacher.count({ where: { schoolId } });
    const classCount = await prisma.class.count({ where: { schoolId } });
    const feeCount = await prisma.feePayment.count({ where: { schoolId } });

    const stats = {
      stats: [
        { label: 'Total Students', value: studentCount.toString(), change: '0', changeLabel: 'this month', icon: 'groups', color: '#0060ac', isHealth: true },
        { label: 'Total Teachers', value: teacherCount.toString(), change: '0', changeLabel: 'this month', icon: 'school', color: '#ff6b6b', isHealth: false },
        { label: 'Active Classes', value: classCount.toString(), change: '0', changeLabel: 'this term', icon: 'meeting_room', color: '#00c2a8', isHealth: true },
        { label: 'Fee Payments', value: feeCount.toString(), change: '0', changeLabel: 'total', icon: 'account_balance_wallet', color: '#6a4c93', isHealth: true },
      ],
      topClasses: [
        { name: 'Grade 10-A', students: 32, attendance: 98 },
        { name: 'Grade 12-B', students: 28, attendance: 96 },
        { name: 'Grade 8-C', students: 35, attendance: 95 },
      ]
    };
    res.json(stats);
  } catch (error) {
    console.error('Fetch dashboard stats error:', error);
    res.status(500).json({ message: 'Server error fetching reports' });
  }
});

module.exports = router;
