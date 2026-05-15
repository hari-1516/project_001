const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001';

/**
 * Sends an image to the Python FastAPI AI service for face recognition.
 * @param {String} imagePath - Local path to the uploaded image.
 * @returns {Promise<Array>} - Array of recognized USNs or Student IDs.
 */
const recognizeFaces = async (imagePath) => {
  try {
    const form = new FormData();
    form.append('file', fs.createReadStream(imagePath));

    const response = await axios.post(`${AI_SERVICE_URL}/recognize`, form, {
      headers: {
        ...form.getHeaders(),
      },
    });

    // Expecting the AI service to return something like: { recognized_students: ['1RV22CS001', '1RV22CS002'] }
    return response.data.recognized_students || [];
  } catch (error) {
    console.error('Error communicating with AI Service:', error.message);
    throw new Error('Failed to process image through AI service');
  }
};

module.exports = {
  recognizeFaces
};
