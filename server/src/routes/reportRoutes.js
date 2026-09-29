const router = require('express').Router();
const { secureRouter, ADMIN_ROLES } = require('../middleware/routeSecurity');
secureRouter(router, { readRoles: ADMIN_ROLES });
router.get('/dashboard-stats', async (req, res) => res.json(await require('../services/schoolAnalytics').schoolAnalytics(req.schoolId)));
module.exports = router;
