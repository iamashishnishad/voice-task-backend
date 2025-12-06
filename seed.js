const mongoose = require('mongoose');
const Task = require('./models/Task');
require('dotenv').config();

const sampleTasks = [
  {
    title: 'Review authentication module PR',
    description: 'Check the pull request for the new authentication implementation',
    status: 'todo',
    priority: 'high',
    dueDate: new Date(Date.now() + 86400000) // Tomorrow
  },
  {
    title: 'Update project documentation',
    description: 'Add new API endpoints to the documentation',
    status: 'inprogress',
    priority: 'medium',
    dueDate: new Date(Date.now() + 259200000) // 3 days from now
  },
  {
    title: 'Fix login page styling',
    description: 'Adjust padding and colors on the login form',
    status: 'done',
    priority: 'low',
    dueDate: new Date(Date.now() - 86400000) // Yesterday
  },
  {
    title: 'Implement voice input feature',
    description: 'Add speech-to-text functionality for task creation',
    status: 'todo',
    priority: 'critical',
    dueDate: new Date(Date.now() + 172800000) // 2 days from now
  }
];

async function seedDatabase() {
  try {
    // Use your MongoDB Atlas connection string
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://<db_username>:<db_password>@cluster0.tom7bug.mongodb.net/task_tracker?retryWrites=true&w=majority');
    console.log('Connected to MongoDB Atlas');
    
    // Clear existing tasks
    await Task.deleteMany({});
    console.log('Cleared existing tasks');
    
    // Insert sample tasks
    await Task.insertMany(sampleTasks);
    console.log('Added sample tasks');
    
    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();