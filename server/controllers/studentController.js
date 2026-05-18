const Student = require('../models/Student');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001';

/**
 * @desc    Register a new student (works with or without AI service)
 * @route   POST /api/students
 * @access  Private
 */
const registerStudent = async (req, res) => {
  const { name, usn, department, year, section } = req.body;

  try {
    if (!name || !usn || !department) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Name, USN and Department are required' });
    }

    // Check for duplicate USN
    const studentExists = await Student.findOne({ usn: usn.toUpperCase() });
    if (studentExists) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: `Student with USN "${usn.toUpperCase()}" already exists` });
    }

    let embedding = [];
    let imagePath = req.file ? req.file.path : null;

    // Try to get face embedding from AI service — non-blocking if AI is offline
    if (req.file) {
      try {
        const form = new FormData();
        form.append('file', fs.createReadStream(req.file.path));

        const aiResponse = await axios.post(`${AI_SERVICE_URL}/register`, form, {
          headers: { ...form.getHeaders() },
          timeout: 5000, // Don't wait more than 5s for AI service
        });

        if (aiResponse.data?.embedding) {
          embedding = aiResponse.data.embedding;
        }
      } catch (aiError) {
        // AI service is offline — save student without embedding (can be added later)
        console.warn('⚠️ AI service unavailable. Registering student without face embedding.');
      }
    }

    const student = await Student.create({
      name,
      usn: usn.toUpperCase(),
      department,
      year: parseInt(year) || 1,
      section: section?.toUpperCase() || 'A',
      embedding,
      images: imagePath ? [imagePath] : []
    });

    res.status(201).json({
      message: embedding.length > 0
        ? 'Student registered successfully with face embedding!'
        : 'Student registered successfully! (Face embedding will be added when AI service is running)',
      student: {
        _id: student._id,
        name: student.name,
        usn: student.usn,
        department: student.department,
        year: student.year,
        section: student.section,
        hasEmbedding: embedding.length > 0
      }
    });

  } catch (error) {
    console.error('Registration Error:', error.message);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: error.message || 'Server error during registration' });
  }
};

/**
 * @desc    Get all students
 * @route   GET /api/students
 * @access  Private
 */
const getStudents = async (req, res) => {
  try {
    const students = await Student.find({}).select('-embedding').sort({ createdAt: -1 });
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching students' });
  }
};

/**
 * @desc    Get single student by ID
 * @route   GET /api/students/:id
 * @access  Private
 */
const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).select('-embedding');
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const fields = ['name', 'usn', 'department', 'year', 'section'];
    fields.forEach(field => {
      if (req.body[field] !== undefined) student[field] = req.body[field];
    });

    if (student.usn) student.usn = student.usn.toUpperCase();
    if (student.section) student.section = student.section.toUpperCase();
    if (req.file?.path) student.images.push(req.file.path);

    const updated = await student.save();
    res.json({
      _id: updated._id,
      name: updated.name,
      usn: updated.usn,
      department: updated.department,
      year: updated.year,
      section: updated.section,
      images: updated.images,
      hasEmbedding: updated.embedding?.length > 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error updating student' });
  }
};

/**
 * @desc    Delete a student
 * @route   DELETE /api/students/:id
 * @access  Private
 */
const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    await student.deleteOne();
    res.json({ message: 'Student removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  registerStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent
};
