const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const DEV_MODE = String(process.env.DEV_MODE || 'false').toLowerCase() === 'true';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const EMAIL_FROM = process.env.MAIL_DEFAULT_SENDER || 'onboarding@resend.dev';
const EMAIL_ENABLED = Boolean(RESEND_API_KEY && !DEV_MODE);

async function sendEmail(to, subject, text) {
  if (!EMAIL_ENABLED) {
    console.log('[MAILER] Email disabled (DEV_MODE or missing RESEND_API_KEY). OTP not sent.');
    return false;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [to],
        subject,
        text,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.warn(`[MAILER] Resend error sending to ${to}:`, data);
      return false;
    }

    console.log(`[MAILER] Email sent to ${to} (id: ${data.id})`);
    return true;
  } catch (error) {
    console.warn('[MAILER] Failed to send email:', error.message);
    return false;
  }
}

module.exports = { sendEmail, EMAIL_ENABLED, DEV_MODE };
