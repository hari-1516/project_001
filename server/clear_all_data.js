const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('Error: MONGO_URI environment variable is not set. Copy .env.example to .env and configure it.');
  process.exit(1);
}

async function clearAllData() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const Student = mongoose.model('Student', new mongoose.Schema({}, { strict: false }));
        const Attendance = mongoose.model('Attendance', new mongoose.Schema({}, { strict: false }));

        const studentCount = await Student.countDocuments();
        const attendanceCount = await Attendance.countDocuments();

        console.log(`Found ${studentCount} students and ${attendanceCount} attendance records`);

        await Student.deleteMany({});
        await Attendance.deleteMany({});

        console.log('Deleted all students');
        console.log('Deleted all attendance records');

        console.log('\nDatabase cleared successfully!');
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

clearAllData();