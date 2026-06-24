const Student = require('../models/Student');
const fs = require('fs').promises;
const { registerFace } = require('../services/aiService');

/**
 * @desc    Register a new student (works with or without AI service)
 * @route   POST /api/students
 * @access  Private
 */
const registerStudent = async (req, res) => {
  const { name, usn, department, year, section } = req.body;

  try {
    if (!name || !usn || !department) {
      if (req.files) {
        await Promise.all(req.files.map(f => fs.unlink(f.path).catch(() => {})));
      } else if (req.file) {
        await fs.unlink(req.file.path).catch(() => {});
      }
      return res.status(400).json({ message: 'Name, USN and Department are required' });
    }

    // Check for duplicate USN
    const studentExists = await Student.findOne({ usn: usn.toUpperCase() });
    if (studentExists) {
      if (req.files) {
        await Promise.all(req.files.map(f => fs.unlink(f.path).catch(() => {})));
      } else if (req.file) {
        await fs.unlink(req.file.path).catch(() => {});
      }
      return res.status(400).json({ message: `Student with USN "${usn.toUpperCase()}" already exists` });
    }

    let embedding = [];
    let imagePaths = [];

    const files = req.files || (req.file ? [req.file] : []);

    if (files.length > 0) {
      imagePaths = files.map(f => f.path);
      const result = await registerFace(files);
      embedding = result.embedding;
    }

    const student = await Student.create({
      name,
      usn: usn.toUpperCase(),
      department,
      year: parseInt(year) || 1,
      section: section?.toUpperCase() || 'A',
      embedding,
      images: imagePaths
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
    if (req.files) {
      await Promise.all(req.files.map(f => fs.unlink(f.path).catch(() => {})));
    } else if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
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

/**
 * @desc    Re-register face embedding for an existing student
 * @route   POST /api/students/:id/re-register
 * @access  Private
 */
const reRegisterFace = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const files = req.files || (req.file ? [req.file] : []);
    if (files.length === 0) {
      return res.status(400).json({ message: 'At least one face image is required' });
    }

    const imagePaths = files.map(f => f.path);
    const { embedding } = await registerFace(files);

    if (embedding.length === 0) {
      await Promise.all(files.map(f => fs.unlink(f.path).catch(() => {})));
      return res.status(400).json({ message: 'Failed to generate face embedding. Make sure the image contains a clear face.' });
    }

    student.embedding = embedding;
    student.images = [...(student.images || []), ...imagePaths];
    await student.save();

    await Promise.all(files.map(f => fs.unlink(f.path).catch(() => {})));

    res.json({
      message: 'Face embedding updated successfully',
      student: {
        _id: student._id,
        name: student.name,
        usn: student.usn,
        hasEmbedding: true
      }
    });
  } catch (error) {
    console.error('Re-registration Error:', error.message);
    if (req.files) {
      await Promise.all(req.files.map(f => fs.unlink(f.path).catch(() => {})));
    }
    res.status(500).json({ message: error.message || 'Server error during re-registration' });
  }
};

module.exports = {
  registerStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  reRegisterFace
};
