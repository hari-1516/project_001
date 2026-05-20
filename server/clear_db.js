require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');

const Student = require('./models/Student');
const Attendance = require('./models/Attendance');
const Notification = require('./models/Notification');

dns.setServers(['8.8.8.8', '8.8.4.4']);

mongoose.connect(process.env.MONGO_URI).then(async () => {
    console.log("Connected to MongoDB.");
    
    const studentRes = await Student.deleteMany({});
    console.log(`Deleted ${studentRes.deletedCount} students.`);
    
    const attendanceRes = await Attendance.deleteMany({});
    console.log(`Deleted ${attendanceRes.deletedCount} attendance records.`);
    
    const notificationRes = await Notification.deleteMany({});
    console.log(`Deleted ${notificationRes.deletedCount} notifications.`);
    
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
