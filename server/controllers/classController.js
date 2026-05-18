const Class = require('../models/Class');
const Student = require('../models/Student');

const getClasses = async (req, res) => {
  try {
    const classes = await Class.find({})
      .populate('teacher', 'name email')
      .populate('students', 'name usn department section year')
      .sort({ createdAt: -1 });

    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createClass = async (req, res) => {
  const { classId, department, section, year, subject, teacher, students = [] } = req.body;

  try {
    const studentIds = students.length
      ? students
      : (await Student.find({
          department: department?.toUpperCase(),
          section: section?.toUpperCase(),
          year: Number(year)
        }).select('_id')).map(student => student._id);

    const classRecord = await Class.create({
      classId: classId.toUpperCase(),
      department: department.toUpperCase(),
      section: section.toUpperCase(),
      year: Number(year),
      subject,
      teacher,
      students: studentIds
    });

    res.status(201).json(classRecord);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateClass = async (req, res) => {
  try {
    const classRecord = await Class.findById(req.params.id);
    if (!classRecord) return res.status(404).json({ message: 'Class not found' });

    const fields = ['classId', 'department', 'section', 'year', 'subject', 'teacher', 'students'];
    fields.forEach(field => {
      if (req.body[field] !== undefined) classRecord[field] = req.body[field];
    });

    if (classRecord.classId) classRecord.classId = classRecord.classId.toUpperCase();
    if (classRecord.department) classRecord.department = classRecord.department.toUpperCase();
    if (classRecord.section) classRecord.section = classRecord.section.toUpperCase();

    const updated = await classRecord.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteClass = async (req, res) => {
  try {
    const classRecord = await Class.findById(req.params.id);
    if (!classRecord) return res.status(404).json({ message: 'Class not found' });

    await classRecord.deleteOne();
    res.json({ message: 'Class removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getClasses, createClass, updateClass, deleteClass };
