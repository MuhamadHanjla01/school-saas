const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');

// Get all transport routes
router.get('/', async (req, res) => {
  try {
    const routes = await prisma.transportRoute.findMany({
      where: { schoolId: req.tenant.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(routes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch transport routes' });
  }
});

// Create or update a transport route
router.post('/', async (req, res) => {
  try {
    const { id, routeName, vehicleNumber, driverName, driverPhone, capacity } = req.body;
    if (id) {
      const route = await prisma.transportRoute.update({
        where: { id },
        data: { routeName, vehicleNumber, driverName, driverPhone, capacity: capacity ? parseInt(capacity) : null }
      });
      res.json(route);
    } else {
      const route = await prisma.transportRoute.create({
        data: {
          routeName,
          vehicleNumber,
          driverName,
          driverPhone,
          capacity: capacity ? parseInt(capacity) : null,
          schoolId: req.tenant.id
        }
      });
      res.status(201).json(route);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save transport route' });
  }
});

// Delete transport route
router.delete('/:id', async (req, res) => {
  try {
    await prisma.transportRoute.delete({ where: { id: req.params.id } });
    res.json({ message: 'Transport route deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete transport route' });
  }
});

module.exports = router;
