const express = require('express');
const router = express.Router();
const natural = require('natural');

// Initialize tokenizer and classifier
const tokenizer = new natural.WordTokenizer();
const classifier = new natural.BayesClassifier();

// Train priority classifier with sample data
const priorityTrainingData = [
  { text: 'urgent task', category: 'high' },
  { text: 'high priority', category: 'high' },
  { text: 'critical issue', category: 'critical' },
  { text: 'urgent matter', category: 'high' },
  { text: 'important', category: 'high' },
  { text: 'low priority', category: 'low' },
  { text: 'not urgent', category: 'low' },
  { text: 'whenever you have time', category: 'low' },
  { text: 'medium priority', category: 'medium' },
  { text: 'normal priority', category: 'medium' },
  { text: 'priority high', category: 'high' },
  { text: 'priority low', category: 'low' },
  { text: 'priority medium', category: 'medium' },
  { text: 'critical bug', category: 'critical' },
  { text: 'urgent fix', category: 'high' }
];

priorityTrainingData.forEach(item => {
  classifier.addDocument(item.text, item.category);
});
classifier.train();

// Parse voice input
router.post('/parse', (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'No text provided' });
    }
    
    console.log('Parsing voice input:', text);
    
    const parsedResult = parseVoiceInput(text);
    console.log('Parsed result:', parsedResult);
    
    // Check for auto-create commands
    const lowerText = text.toLowerCase();
    parsedResult.autoCreate = shouldAutoCreate(lowerText);
    
    res.json(parsedResult);
  } catch (error) {
    console.error('Voice parsing error:', error);
    res.status(500).json({ 
      error: 'Failed to parse voice input',
      details: error.message 
    });
  }
});

function parseVoiceInput(text) {
  const result = {
    transcript: text,
    title: '',
    description: '',
    dueDate: null,
    priority: 'medium',
    status: 'todo',
    autoCreate: false
  };
  
  const lowerText = text.toLowerCase();
  
  // Extract title (main task description)
  result.title = extractTitle(text);
  
  // Extract priority
  result.priority = extractPriority(lowerText);
  
  // Extract status - auto-detect "done" from voice
  result.status = extractStatus(lowerText);
  
  // Extract due date
  result.dueDate = extractDueDate(lowerText);
  
  // Extract description (remaining text after removing title indicators)
  result.description = extractDescription(lowerText, result.title);
  
  // Check for auto-create commands
  result.autoCreate = shouldAutoCreate(lowerText);
  
  return result;
}

function extractTitle(text) {
  let title = text.toLowerCase();
  
  // Remove common phrases including auto-create commands
  const removePhrases = [
    'create a',
    'add a',
    'make a',
    'remind me to',
    'i need to',
    'please',
    'can you',
    'hey',
    'hi',
    'hello',
    'create this',
    'add this',
    'save this',
    'make this',
    'task to',
    'task for',
    'reminder to',
    'reminder for'
  ];
  
  removePhrases.forEach(phrase => {
    if (title.includes(phrase)) {
      title = title.replace(phrase, '').trim();
    }
  });
  
  // Remove status words
  const statusWords = ['done', 'completed', 'finished', 'todo', 'in progress', 'working on'];
  statusWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    title = title.replace(regex, '').trim();
  });
  
  // Remove priority words
  const priorityWords = ['urgent', 'critical', 'important', 'high', 'low', 'medium', 'priority'];
  priorityWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    title = title.replace(regex, '').trim();
  });
  
  // Remove auto-create commands at the end
  const autoCommands = ['create this', 'add this', 'save this', 'make this', 'done', 'complete'];
  autoCommands.forEach(command => {
    if (title.endsWith(command)) {
      title = title.substring(0, title.length - command.length).trim();
    }
  });
  
  // Remove date and time phrases
  const datePhrases = [
    'tomorrow',
    'today',
    'next week',
    'next month',
    'this week',
    'this month',
    'by friday',
    'by monday',
    'by tuesday',
    'by wednesday',
    'by thursday',
    'by saturday',
    'by sunday',
    'due by',
    'due on',
    'by tomorrow',
    'by today',
    'in 2 days',
    'in 3 days',
    'in a week',
    'in one week',
    'in two weeks',
    'in three weeks',
    'end of day',
    'end of week',
    'eod',
    'eow'
  ];
  
  datePhrases.forEach(phrase => {
    const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
    title = title.replace(regex, '').trim();
  });
  
  // Remove relative time phrases
  const timePhrases = [
    'morning',
    'afternoon',
    'evening',
    'night',
    'noon',
    'midnight',
    'today',
    'tomorrow'
  ];
  
  timePhrases.forEach(phrase => {
    const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
    title = title.replace(regex, '').trim();
  });
  
  // Clean up extra spaces and punctuation
  title = title.replace(/\s+/g, ' ').trim();
  title = title.replace(/^[,\s.:!-]+|[,\s.:!-]+$/g, '');
  
  // Capitalize first letter
  if (title.length > 0) {
    // Capitalize each word for better readability
    title = title.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    return title;
  }
  
  return 'New Task';
}

function extractDueDate(text) {
  const now = new Date();
  
  // Check for common date patterns
  if (text.includes('tomorrow')) {
    const date = new Date(now);
    date.setDate(date.getDate() + 1);
    date.setHours(18, 0, 0, 0); // 6 PM default
    return date;
  }
  
  if (text.includes('today')) {
    const date = new Date(now);
    date.setHours(18, 0, 0, 0);
    return date;
  }
  
  if (text.includes('next week')) {
    const date = new Date(now);
    date.setDate(date.getDate() + 7);
    date.setHours(18, 0, 0, 0);
    return date;
  }
  
  if (text.includes('next month')) {
    const date = new Date(now);
    date.setMonth(date.getMonth() + 1);
    date.setHours(18, 0, 0, 0);
    return date;
  }
  
  if (text.includes('in 2 days') || text.includes('in two days')) {
    const date = new Date(now);
    date.setDate(date.getDate() + 2);
    date.setHours(18, 0, 0, 0);
    return date;
  }
  
  if (text.includes('in 3 days') || text.includes('in three days')) {
    const date = new Date(now);
    date.setDate(date.getDate() + 3);
    date.setHours(18, 0, 0, 0);
    return date;
  }
  
  if (text.includes('in a week') || text.includes('in one week')) {
    const date = new Date(now);
    date.setDate(date.getDate() + 7);
    date.setHours(18, 0, 0, 0);
    return date;
  }
  
  if (text.includes('end of day') || text.includes('eod')) {
    const date = new Date(now);
    date.setHours(23, 59, 0, 0);
    return date;
  }
  
  if (text.includes('end of week') || text.includes('eow')) {
    const date = new Date(now);
    // Get next Friday
    const dayOfWeek = date.getDay();
    const daysUntilFriday = 5 - dayOfWeek;
    if (daysUntilFriday < 0) daysUntilFriday += 7;
    date.setDate(date.getDate() + daysUntilFriday);
    date.setHours(18, 0, 0, 0);
    return date;
  }
  
  // Day of week patterns
  const daysOfWeek = {
    'monday': 1,
    'tuesday': 2,
    'wednesday': 3,
    'thursday': 4,
    'friday': 5,
    'saturday': 6,
    'sunday': 0
  };
  
  for (const [day, dayNumber] of Object.entries(daysOfWeek)) {
    if (text.includes(`next ${day}`) || text.includes(`by ${day}`) || text.includes(`on ${day}`)) {
      const date = new Date(now);
      const currentDay = date.getDay();
      let daysToAdd = dayNumber - currentDay;
      if (daysToAdd <= 0) daysToAdd += 7;
      date.setDate(date.getDate() + daysToAdd);
      date.setHours(18, 0, 0, 0);
      return date;
    }
    
    // Handle "this Monday", "this Friday", etc.
    if (text.includes(`this ${day}`)) {
      const date = new Date(now);
      const currentDay = date.getDay();
      let daysToAdd = dayNumber - currentDay;
      if (daysToAdd < 0) daysToAdd += 7;
      date.setDate(date.getDate() + daysToAdd);
      date.setHours(18, 0, 0, 0);
      return date;
    }
  }
  
  // Time of day patterns
  if (text.includes('morning')) {
    const date = new Date(now);
    date.setDate(date.getDate() + (text.includes('tomorrow morning') ? 1 : 0));
    date.setHours(9, 0, 0, 0);
    return date;
  }
  
  if (text.includes('afternoon')) {
    const date = new Date(now);
    date.setDate(date.getDate() + (text.includes('tomorrow afternoon') ? 1 : 0));
    date.setHours(14, 0, 0, 0);
    return date;
  }
  
  if (text.includes('evening')) {
    const date = new Date(now);
    date.setDate(date.getDate() + (text.includes('tomorrow evening') ? 1 : 0));
    date.setHours(18, 0, 0, 0);
    return date;
  }
  
  if (text.includes('night')) {
    const date = new Date(now);
    date.setDate(date.getDate() + (text.includes('tomorrow night') ? 1 : 0));
    date.setHours(21, 0, 0, 0);
    return date;
  }
  
  return null;
}

function extractPriority(text) {
  if (text.includes('critical') || text.includes('urgent') || text.includes('asap')) {
    return 'critical';
  }
  
  if (text.includes('high priority') || text.includes('high-priority') || 
      text.includes('priority high') || text.includes('important')) {
    return 'high';
  }
  
  if (text.includes('low priority') || text.includes('low-priority') || 
      text.includes('priority low') || text.includes('not urgent') ||
      text.includes('whenever') || text.includes('not important')) {
    return 'low';
  }
  
  if (text.includes('medium priority') || text.includes('normal priority') || 
      text.includes('priority medium') || text.includes('regular priority')) {
    return 'medium';
  }
  
  // Use simple keyword matching
  if (text.includes('high')) {
    return 'high';
  }
  
  if (text.includes('low')) {
    return 'low';
  }
  
  if (text.includes('medium')) {
    return 'medium';
  }
  
  // Use classifier as fallback
  try {
    const classification = classifier.classify(text);
    return classification || 'medium';
  } catch (error) {
    return 'medium';
  }
}

function extractStatus(text) {
  // Auto-detect "done" from voice - check if "done" is at the end or standalone
  if (text.endsWith(' done') || 
      text.endsWith(' completed') || 
      text.endsWith(' finished') ||
      text.includes('mark as done') ||
      text.includes('mark done') ||
      text.includes('is done') ||
      text.includes('already done') ||
      text.includes('task done')) {
    return 'done';
  }
  
  if (text.includes('in progress') || 
      text.includes('working on') || 
      text.includes('currently doing') ||
      text.includes('started') ||
      text.includes('working')) {
    return 'inprogress';
  }
  
  if (text.includes('todo') || 
      text.includes('to do') || 
      text.includes('need to') ||
      text.includes('have to') ||
      text.includes('should')) {
    return 'todo';
  }
  
  // Default to todo for new tasks
  return 'todo';
}

function extractDescription(fullText, title) {
  // Simple description extraction
  let description = fullText.toLowerCase();
  const titleLower = title.toLowerCase();
  
  // Remove title if present
  if (description.includes(titleLower)) {
    description = description.replace(titleLower, '').trim();
  }
  
  // Remove common task phrases
  const taskPhrases = [
    'create a',
    'add a',
    'make a',
    'remind me to',
    'please',
    'can you',
    'i need to',
    'i have to',
    'i should',
    'we need to',
    'we have to'
  ];
  
  taskPhrases.forEach(phrase => {
    if (description.includes(phrase)) {
      description = description.replace(phrase, '').trim();
    }
  });
  
  // Remove auto-create commands
  const autoCommands = ['create this', 'add this', 'save this', 'make this'];
  autoCommands.forEach(command => {
    if (description.includes(command)) {
      description = description.replace(command, '').trim();
    }
  });
  
  // Remove priority and date words
  const removeWords = [
    'urgent', 'critical', 'important', 'asap',
    'high', 'low', 'medium',
    'priority', 'priorities',
    'tomorrow', 'today', 'next week', 'next month',
    'this week', 'this month',
    'by', 'due', 'on', 'at',
    'morning', 'afternoon', 'evening', 'night',
    'done', 'completed', 'finished',
    'todo', 'to do', 'in progress'
  ];
  
  removeWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    description = description.replace(regex, '').trim();
  });
  
  // Clean up
  description = description.replace(/\s+/g, ' ').trim();
  description = description.replace(/^[,\s.:!-]+|[,\s.:!-]+$/g, '');
  
  if (description && description.length > 0 && !isCommonPhrase(description)) {
    // Capitalize first letter of each sentence
    description = description.split('. ')
      .map(sentence => sentence.charAt(0).toUpperCase() + sentence.slice(1))
      .join('. ');
    
    // Capitalize first letter if not already
    if (description.length > 0) {
      description = description.charAt(0).toUpperCase() + description.slice(1);
    }
    
    return description;
  }
  
  return '';
}

function isCommonPhrase(text) {
  const commonPhrases = [
    'task',
    'reminder',
    'thing',
    'item',
    'work',
    'job',
    'project'
  ];
  
  return commonPhrases.some(phrase => text === phrase || text.startsWith(`${phrase} `));
}

function shouldAutoCreate(text) {
  const autoCreatePhrases = [
    'create this',
    'add this',
    'save this',
    'make this',
    'done',
    'complete this',
    'finish this',
    'add now',
    'create now',
    'save now'
  ];
  
  // Check if any auto-create phrase is at the end of the text
  return autoCreatePhrases.some(phrase => 
    text.endsWith(phrase) || 
    text.includes(` ${phrase}`) ||
    text.includes(`${phrase} `)
  );
}

// Test endpoint to see parsed results
router.post('/test', (req, res) => {
  const testPhrases = [
    "Create a high priority task to review the pull request for the authentication module by tomorrow evening",
    "Remind me to send the project proposal to the client by next Wednesday, it's high priority",
    "Fix login page bug critical urgent",
    "Update documentation low priority whenever",
    "Meeting with team tomorrow morning create this",
    "Submit report by Friday done",
    "Code review for PR #123 medium priority in progress",
    "Prepare presentation for next week important",
    "Debug payment gateway issue high priority today create this",
    "Email client about project updates"
  ];
  
  const results = testPhrases.map(phrase => ({
    input: phrase,
    parsed: parseVoiceInput(phrase)
  }));
  
  res.json(results);
});

module.exports = router;