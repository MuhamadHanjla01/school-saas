const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');

// Middleware to check if user is SuperAdmin
const requireSuperAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'SuperAdmin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: SuperAdmin only' });
  }
};

// Apply to all routes in this file
router.use(requireSuperAdmin);

// Dashboard Stats
router.get('/dashboard-stats', async (req, res) => {
  try {
    const totalSchools = await prisma.school.count();
    const activeSchools = await prisma.school.count({ where: { isActive: true } });
    
    // Recent schools
    const recent = await prisma.school.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        name: true,
        createdAt: true,
        isActive: true,
        plan: true
      }
    });

    res.json({
      totalSchools,
      activeSchools,
      recentSchools: recent.map(r => ({
        name: r.name,
        date: new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status: r.isActive ? 'Active' : 'Suspended',
        plan: r.plan
      }))
    });
  } catch (error) {
    console.error('Fetch dashboard stats error:', error);
    res.status(500).json({ message: 'Server error fetching stats' });
  }
});

// Get all schools (tenants)
router.get('/schools', async (req, res) => {
  try {
    const schools = await prisma.school.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { students: true }
        }
      }
    });
    
    // Format for frontend
    const formatted = schools.map(s => ({
      id: s.id,
      name: s.name,
      joined: new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      subdomain: s.domain || `${s.slug}.erpzo.com`,
      plan: s.plan,
      planColor: s.plan === 'Enterprise' ? 'bg-secondary/10 text-secondary' : 
                 s.plan === 'Pro' ? 'bg-tertiary/10 text-tertiary' : 'bg-surface-variant text-on-surface-variant',
      students: s._count.students.toString(),
      studentPct: Math.min((s._count.students / 2500) * 100, 100) + '%',
      studentColor: 'bg-primary-container',
      status: s.isActive ? 'Active' : 'Suspended',
      statusColor: s.isActive ? 'bg-primary-container/10 text-primary' : 'bg-error-container text-on-error-container',
      statusDot: s.isActive ? 'bg-primary-container' : 'bg-error',
      fallback: s.name.substring(0, 2).toUpperCase(),
      logo: s.logo,
      slug: s.slug
    }));
    
    res.json(formatted);
  } catch (error) {
    console.error('Fetch schools error:', error);
    res.status(500).json({ message: 'Server error fetching schools' });
  }
});

// Create a new school
router.post('/schools', async (req, res) => {
  try {
    const { name, email, plan } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    
    // Check if slug exists
    const existing = await prisma.school.findUnique({ where: { slug } });
    if (existing) {
      return res.status(400).json({ message: 'School with similar name already exists' });
    }

    const school = await prisma.school.create({
      data: {
        name,
        slug,
        email,
        plan: plan || 'Free',
        isActive: true
      }
    });
    
    res.status(201).json({ message: 'School created successfully', school });
  } catch (error) {
    console.error('Create school error:', error);
    res.status(500).json({ message: 'Server error creating school' });
  }
});

// Get users for a school
router.get('/schools/:id/users', async (req, res) => {
  try {
    const { id } = req.params;
    const users = await prisma.user.findMany({
      where: { schoolId: id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });
    res.json(users);
  } catch (error) {
    console.error('Fetch school users error:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
});

// Update school
router.put('/schools/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, subdomain, status } = req.body;
    
    const isActive = status !== 'Suspended' && status !== 'Inactive';
    let updateData = { name, isActive };

    if (subdomain) {
      updateData.domain = subdomain;
      updateData.slug = subdomain.split('.')[0];
    }

    const school = await prisma.school.update({
      where: { id },
      data: updateData
    });
    
    res.json({ message: 'School updated successfully', school });
  } catch (error) {
    console.error('Update school error:', error);
    res.status(500).json({ message: 'Server error updating school' });
  }
});

// Delete school
router.delete('/schools/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.school.delete({ where: { id } });
    res.json({ message: 'School deleted successfully' });
  } catch (error) {
    console.error('Delete school error:', error);
    res.status(500).json({ message: 'Server error deleting school' });
  }
});

module.exports = router;
