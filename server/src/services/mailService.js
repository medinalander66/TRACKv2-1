const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

exports.sendEmailNow = async ({ to, subject, html }) => {
  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM || 'onboarding@resend.dev',
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
  });

  if (error) throw new Error(error.message || 'Failed to send email.');
  return data;
};