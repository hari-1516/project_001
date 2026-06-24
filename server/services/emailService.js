const nodemailer = require('nodemailer');

const createTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
};

/**
 * Send an email notification.
 * Gracefully skips if SMTP is not configured.
 */
const sendEmail = async ({ to, subject, html }) => {
  const transporter = createTransporter();
  if (!transporter) {
    console.warn('Email not sent — SMTP not configured');
    return false;
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Email send failed:', error.message);
    return false;
  }
};

/**
 * Send low-attendance alert email to a student or teacher.
 */
const sendLowAttendanceAlert = async (to, studentName, percentage) => {
  return sendEmail({
    to,
    subject: `Low Attendance Alert — ${studentName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #dc2626;">Low Attendance Alert</h2>
        <p>Dear ${studentName},</p>
        <p>Your current attendance is <strong style="color: #dc2626;">${percentage}%</strong>, which is below the required 75% threshold.</p>
        <p>Please ensure regular attendance to avoid academic penalties.</p>
        <hr style="border: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #6b7280; font-size: 12px;">VisionAttend AI — Smart Attendance System</p>
      </div>
    `,
  });
};

/**
 * Send daily attendance summary email.
 */
const sendDailyReport = async (to, date, presentCount, absentCount, totalStudents) => {
  const percentage = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;
  return sendEmail({
    to,
    subject: `Daily Attendance Report — ${date}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #7c3aed;">Daily Attendance Report</h2>
        <p><strong>Date:</strong> ${date}</p>
        <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
          <tr style="background: #f3f4f6;">
            <td style="padding: 10px; border: 1px solid #e5e7eb;">Total Students</td>
            <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">${totalStudents}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">Present</td>
            <td style="padding: 10px; border: 1px solid #e5e7eb; color: #16a34a; font-weight: bold;">${presentCount}</td>
          </tr>
          <tr style="background: #f3f4f6;">
            <td style="padding: 10px; border: 1px solid #e5e7eb;">Absent</td>
            <td style="padding: 10px; border: 1px solid #e5e7eb; color: #dc2626; font-weight: bold;">${absentCount}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">Attendance</td>
            <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">${percentage}%</td>
          </tr>
        </table>
        <hr style="border: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #6b7280; font-size: 12px;">VisionAttend AI — Smart Attendance System</p>
      </div>
    `,
  });
};

module.exports = { sendEmail, sendLowAttendanceAlert, sendDailyReport };
