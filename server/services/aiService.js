const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001';

/**
 * Sends an image to the Python FastAPI AI service for face recognition.
 * Returns metadata gracefully if the AI service is offline.
 * @param {String} imagePath - Local path to the uploaded image.
 * @returns {Promise<Object>} Recognition result and AI metadata.
 */
const recognizeFaces = async (imagePath) => {
  try {
    const form = new FormData();
    form.append('file', fs.createReadStream(imagePath));

    const response = await axios.post(`${AI_SERVICE_URL}/recognize`, form, {
      headers: { ...form.getHeaders() },
      timeout: 60000, // 60 second timeout to allow for heavy AI processing
    });

    return {
      recognizedStudents: response.data.recognized_students || [],
      totalFaces: response.data.total_faces || 0,
      unknownFaces: response.data.unknown_faces || 0,
      liveness: response.data.liveness || null,
      aiAvailable: true,
    };
  } catch (error) {
    // If AI service is offline or times out — don't crash, return empty list
    console.warn('⚠️  AI Service unavailable — attendance marked manually:', error.message);
    return {
      recognizedStudents: [],
      totalFaces: 0,
      unknownFaces: 0,
      liveness: null,
      aiAvailable: false,
      error: error.message,
    };
  }
};

/**
 * Check if the AI service is healthy/online.
 * @returns {Promise<boolean>}
 */
const checkAIHealth = async () => {
  try {
    await axios.get(`${AI_SERVICE_URL}/health`, { timeout: 3000 });
    return true;
  } catch {
    return false;
  }
};

module.exports = { recognizeFaces, checkAIHealth };
