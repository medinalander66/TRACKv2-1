const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getCampusOfficeStats,
  getDepartmentOfficePerformance,
  getConflictForecast,
  getVenuePie,
  getSchedulingConflicts,
  getPersonalEvents,
  getTaskStats,
} = require('../controllers/analyticsController');

router.get('/campus-office-stats', authenticate, getCampusOfficeStats);
router.get('/department-performance', authenticate, getDepartmentOfficePerformance);
router.get('/conflict-forecast', authenticate, getConflictForecast);
router.get('/venue-pie', authenticate, getVenuePie);
router.get('/scheduling-conflicts', authenticate, getSchedulingConflicts);
router.get('/personal-events', authenticate, getPersonalEvents);
router.get('/task-stats', authenticate, getTaskStats);

module.exports = router;