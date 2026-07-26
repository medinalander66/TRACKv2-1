const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

exports.sendAccountCodeEmail = async ({ email, full_name, code }) => {
  const html = `
    <h2>Hello ${full_name || 'User'},</h2>
    <p>Your account code for TRACK:</p>
    <div style="background: #f4f4f4; padding: 16px; border-radius: 8px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 2px;">
      ${code}
    </div>
    <p><a href="${process.env.FRONTEND_URL}/register">Register here</a></p>
  `;

  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM || 'onboarding@resend.dev',
    to: [email],
    subject: 'Your TRACK Account Code',
    html,
  });

  if (error) throw new Error(error.message);
  return data;
};