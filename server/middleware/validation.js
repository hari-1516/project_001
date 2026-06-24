const mongoose = require('mongoose');

const validateObjectId = (paramName) => (req, res, next) => {
  const id = req.params[paramName];
  if (id && !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: `Invalid ${paramName} format` });
  }
  next();
};

const validatePagination = (req, res, next) => {
  if (req.query.page) {
    const page = parseInt(req.query.page);
    if (isNaN(page) || page < 1) {
      return res.status(400).json({ message: 'Page must be a positive integer' });
    }
  }
  if (req.query.limit) {
    const limit = parseInt(req.query.limit);
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return res.status(400).json({ message: 'Limit must be between 1 and 100' });
    }
  }
  next();
};

const validateDateQuery = (req, res, next) => {
  if (req.query.date) {
    const date = new Date(req.query.date);
    if (isNaN(date.getTime())) {
      return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD' });
    }
  }
  next();
};

const validateThreshold = (req, res, next) => {
  if (req.query.threshold) {
    const threshold = Number(req.query.threshold);
    if (isNaN(threshold) || threshold < 0 || threshold > 100) {
      return res.status(400).json({ message: 'Threshold must be between 0 and 100' });
    }
  }
  next();
};

const validateClassBody = (req, res, next) => {
  const { classId, department, section, year } = req.body;
  if (req.method === 'POST') {
    if (!classId || !department || !section || !year) {
      return res.status(400).json({ message: 'classId, department, section, and year are required' });
    }
  }
  if (year && (isNaN(Number(year)) || Number(year) < 1 || Number(year) > 10)) {
    return res.status(400).json({ message: 'Year must be between 1 and 10' });
  }
  next();
};

const validateNotificationIds = (req, res, next) => {
  if (req.body.ids) {
    if (!Array.isArray(req.body.ids)) {
      return res.status(400).json({ message: 'ids must be an array' });
    }
    for (const id of req.body.ids) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid notification id format' });
      }
    }
  }
  next();
};

module.exports = {
  validateObjectId,
  validatePagination,
  validateDateQuery,
  validateThreshold,
  validateClassBody,
  validateNotificationIds
};
