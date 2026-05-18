const Notification = require('../models/Notification');

const createNotification = async ({ type = 'info', title, message, createdBy }) => {
  try {
    return await Notification.create({ type, title, message, createdBy });
  } catch (error) {
    console.warn('Notification could not be saved:', error.message);
    return null;
  }
};

module.exports = { createNotification };
