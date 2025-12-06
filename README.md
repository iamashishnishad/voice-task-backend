# Voice-Enabled Task Tracker

A full-stack task management application with voice input capabilities, inspired by tools like Linear. Users can create tasks by speaking naturally, and the system intelligently parses the input to extract task details.

## Features

### Core Task Management
- Create tasks manually or via voice input
- View tasks in Kanban board and list views
- Update tasks with drag-and-drop functionality
- Delete tasks with confirmation
- Filter and search tasks

### Voice Input Feature
- Speech-to-text capture using browser's Web Speech API
- Intelligent parsing of natural language input
- Extracts title, due date, priority, and status
- Review and edit parsed data before saving

## Tech Stack

### Frontend
- React 18
- Redux Toolkit for state management
- Material-UI for components
- React DnD for drag-and-drop
- React Speech Recognition for voice input
- date-fns for date manipulation

### Backend
- Node.js with Express
- MongoDB with Mongoose
- NLP parsing with compromise and compromise-dates
- Date parsing with date-fns

## Prerequisites

- Node.js 16+
- MongoDB 4.4+
- Modern web browser with Web Speech API support (Chrome, Edge, Safari)

## Installation

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend