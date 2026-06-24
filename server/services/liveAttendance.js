const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { jwtSecret } = require('../config/env');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001';
const AI_SERVICE_API_KEY = process.env.AI_SERVICE_API_KEY || '';
const TEMP_DIR = path.join(__dirname, '..', 'uploads', 'temp');

// Ensure temp dir exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * Handle WebSocket connections for live attendance.
 * Clients send base64 images; server processes them and returns results.
 */
const setupLiveAttendance = (io) => {
  const liveNamespace = io.of('/live-attendance');

  liveNamespace.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const decoded = jwt.verify(token, jwtSecret);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  liveNamespace.on('connection', (socket) => {
    console.log(`Live attendance client connected: ${socket.id} (user: ${socket.user?.id || 'unknown'})`);
    let isProcessing = false;

    socket.on('frame', async (data) => {
      if (isProcessing) return; // Skip if already processing
      isProcessing = true;

      let filePath;
      try {
        const { image, classId } = data;
        if (!image || !classId) {
          socket.emit('error', { message: 'Missing image or classId' });
          return;
        }

        // Save base64 image to temp file
        const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const filename = `live_${uuidv4()}.jpg`;
        filePath = path.join(TEMP_DIR, filename);

        await fs.promises.writeFile(filePath, buffer);

        // Send to AI service
        const form = new FormData();
        form.append('file', fs.createReadStream(filePath));

        const headers = { ...form.getHeaders() };
        if (AI_SERVICE_API_KEY) {
          headers['X-API-Key'] = AI_SERVICE_API_KEY;
        }

        const response = await axios.post(`${AI_SERVICE_URL}/recognize`, form, {
          headers,
          timeout: 30000,
        });

        // Clean up temp file
        await fs.promises.unlink(filePath).catch(() => {});

        // Emit results back
        socket.emit('results', {
          timestamp: new Date().toISOString(),
          recognizedStudents: response.data.recognized_students || [],
          totalFaces: response.data.total_faces || 0,
          unknownFaces: response.data.unknown_faces || 0,
          liveness: response.data.liveness || null,
        });
      } catch (error) {
        console.error('Live attendance processing error:', error.message);
        // Clean up temp file on error
        if (filePath) await fs.promises.unlink(filePath).catch(() => {});
        socket.emit('error', { message: 'Processing failed', detail: error.message });
      } finally {
        isProcessing = false;
      }
    });

    socket.on('disconnect', () => {
      console.log(`Live attendance client disconnected: ${socket.id}`);
    });
  });
};

module.exports = { setupLiveAttendance };
