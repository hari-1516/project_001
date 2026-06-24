const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001';
const AI_SERVICE_API_KEY = process.env.AI_SERVICE_API_KEY || '';

function getHeaders(form) {
  const headers = form ? { ...form.getHeaders() } : {};
  if (AI_SERVICE_API_KEY) {
    headers['X-API-Key'] = AI_SERVICE_API_KEY;
  }
  return headers;
}

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
      headers: getHeaders(form),
      timeout: 180000,
    });

    return {
      recognizedStudents: response.data.recognized_students || [],
      totalFaces: response.data.total_faces || 0,
      unknownFaces: response.data.unknown_faces || 0,
      liveness: response.data.liveness || null,
      aiAvailable: true,
    };
  } catch (error) {
    console.warn('AI Service unavailable — attendance marked manually:', error.message);
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
 * Send images to AI service for face embedding generation.
 * @param {Array} files - Array of file objects with path and originalname.
 * @returns {Promise<Object>} Registration result with embedding.
 */
const registerFace = async (files) => {
  try {
    if (files.length > 1) {
      const form = new FormData();
      for (const file of files) {
        const fileContent = await fs.promises.readFile(file.path);
        form.append('files', fileContent, { filename: file.originalname || file.filename });
      }

      const response = await axios.post(`${AI_SERVICE_URL}/register_multi`, form, {
        headers: getHeaders(form),
        timeout: 60000,
      });

      return { embedding: response.data?.embedding || [], aiAvailable: true };
    } else {
      const form = new FormData();
      const fileContent = await fs.promises.readFile(files[0].path);
      form.append('file', fileContent, { filename: files[0].originalname || files[0].filename });

      const response = await axios.post(`${AI_SERVICE_URL}/register`, form, {
        headers: getHeaders(form),
        timeout: 60000,
      });

      return { embedding: response.data?.embedding || [], aiAvailable: true };
    }
  } catch (aiError) {
    console.warn('AI service unavailable for registration:', aiError.message);
    return { embedding: [], aiAvailable: false };
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

module.exports = { recognizeFaces, registerFace, checkAIHealth };
