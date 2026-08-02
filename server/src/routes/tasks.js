const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  createTask,
  listTasks,
  getTaskById,
  updateTask,
  toggleChecklistItem,
  respondToTask,
  getInvitedTasks,
  deleteTask
} = require('../controllers/tasksController');

router.get('/', authenticate, listTasks);
router.post('/', authenticate, createTask);
router.get('/invited', authenticate, getInvitedTasks);
router.get('/:id', authenticate, getTaskById);
router.put('/:id', authenticate, updateTask);
router.delete('/:id', authenticate, deleteTask);
router.put('/:taskId/respond', authenticate, respondToTask);
router.put('/checklist/:itemId', authenticate, toggleChecklistItem);

module.exports = router;