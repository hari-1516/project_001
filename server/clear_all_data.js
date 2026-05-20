const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://harishsiddaraju2005_db_user:CpEjEesHqK88Y5Ee@cluster0.e4byiil.mongodb.net/visionattend';

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