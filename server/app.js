const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const http = require('http');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

const { corsOrigins, port, isProduction } = require('./config/env');

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: corsOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: { message: 'Too many requests, please try again later' },
});
app.use('/api/', limiter);

// Auth rate limiting (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Too many auth attempts, please try again later' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

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
app.use(express.json({ limit: '10mb' }));
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

const axios = require('axios');
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

// Setup WebSocket for live attendance
const { setupLiveAttendance } = require('./services/liveAttendance');
setupLiveAttendance(io);

// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    message: err.message,
    stack: isProduction ? null : err.stack,
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${port}`);
});
