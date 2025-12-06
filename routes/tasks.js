const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { body, validationResult } = require('express-validator');

// Get all tasks
router.get('/', async (req, res) => {
  try {
    const { status, priority, search } = req.query;
    
    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (priority) {
      query.priority = priority;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const tasks = await Task.find(query).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Create new task
// Create new task
// Create new task
router.post('/', [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').optional().trim(),
  body('status').optional().isIn(['todo', 'inprogress', 'done']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('dueDate').optional().custom((value, { req }) => {
    // Allow null or undefined
    if (value === null || value === undefined || value === '') {
      return true;
    }
    // If value exists, validate it's a valid ISO string
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
    if (typeof value === 'string' && isoRegex.test(value)) {
      return true;
    }
    // Also allow Date objects
    if (value instanceof Date && !isNaN(value)) {
      return true;
    }
    throw new Error('Invalid date format');
  })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    // Clean up the data
    const taskData = {
      title: req.body.title.trim(),
      description: req.body.description ? req.body.description.trim() : '',
      status: req.body.status || 'todo',
      priority: req.body.priority || 'medium',
      dueDate: req.body.dueDate || null
    };
    
    console.log('Creating task with data:', taskData);
    
    const task = new Task(taskData);
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    console.error('Task creation error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Get single task
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// Update task
// Update task
router.put('/:id', [
  body('title').optional().trim().notEmpty(),
  body('status').optional().isIn(['todo', 'inprogress', 'done']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('dueDate').optional().custom((value, { req }) => {
    // Allow null or undefined
    if (value === null || value === undefined || value === '') {
      return true;
    }
    // If value exists, validate it's a valid ISO string
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
    if (typeof value === 'string' && isoRegex.test(value)) {
      return true;
    }
    // Also allow Date objects
    if (value instanceof Date && !isNaN(value)) {
      return true;
    }
    throw new Error('Invalid date format');
  })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete task
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Get task statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const stats = await Task.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const priorityStats = await Task.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const overdueTasks = await Task.find({
      dueDate: { $lt: new Date() },
      status: { $ne: 'done' }
    }).countDocuments();
    
    res.json({
      statusStats: stats,
      priorityStats,
      overdueTasks
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

module.exports = router;