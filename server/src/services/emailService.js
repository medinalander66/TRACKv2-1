const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  family: 4,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  connectionTimeout: 60000,
});

exports.sendAccountCodeEmail = async ({ email, full_name, code }) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP credentials not configured.');
  }

  const subject = 'Your TRACK Account Code';
  const html = `
    <h2>Hello ${full_name || 'User'},</h2>
    <p>Your account code for TRACK has been generated:</p>
    <div style="background: #f4f4f4; padding: 16px; border-radius: 8px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 2px;">
      ${code}
    </div>
    <p>Please use this code to complete your registration at:</p>
    <p><a href="${process.env.FRONTEND_URL}/register">${process.env.FRONTEND_URL}/register</a></p>
    <p>This code will expire in 7 days.</p>
    <br/>
    <p>Thank you,<br/>TRACK Team</p>
  `;

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@trackv2.com',
      to: email,
      subject,
      html
    });
    return info;
  } catch (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }
};