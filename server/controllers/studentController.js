const Student = require('../models/Student');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001';

const registerStudent = async (req, res) => {
  const { name, usn, department } = req.body;

  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Student image is required for registration' });
    }

    const studentExists = await Student.findOne({ usn });
    if (studentExists) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Student with this USN already exists' });
    }

    // Call Python AI service to get the embedding
    const form = new FormData();
    form.append('file', fs.createReadStream(req.file.path));

    const aiResponse = await axios.post(`${AI_SERVICE_URL}/register`, form, {
      headers: { ...form.getHeaders() },
    });

    const embedding = aiResponse.data.embedding;

    if (!embedding || embedding.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Failed to extract face embedding from the image' });
    }

    const student = await Student.create({
      name,
      usn,
      department,
      embedding,
      images: [req.file.path]
    });

    res.status(201).json({
      message: 'Student registered successfully',
      student: {
        _id: student._id,
        name: student.name,
        usn: student.usn,
        department: student.department
      }
    });

  } catch (error) {
    console.error('Registration Error:', error.message);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Server error during registration' });
  }
};

const getStudents = async (req, res) => {
  try {
    const students = await Student.find({}).select('-embedding');
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching students' });
  }
};

module.exports = {
  registerStudent,
  getStudents
};
