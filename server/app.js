const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

const { corsOrigins, port, isProduction } = require('./config/env');

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin(origin, callback) {
    if (!origin || corsOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make uploads folder static so images can be retrieved
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/classes', require('./routes/classRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// Basic route
app.get('/', (req, res) => {
  res.send('VisionAttend AI API is running...');
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/ai/health', async (req, res) => {
  try {
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8001';
    const { data } = await axios.get(`${aiServiceUrl}/health`, { timeout: 3000 });
    res.json({ status: 'ok', ai: data });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: 'AI service is unavailable',
      detail: error.message,
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: isProduction ? null : err.stack,
  });
});

app.listen(port, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${port}`);
});
