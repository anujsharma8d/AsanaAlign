const path = require('path');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const DEV_MODE = String(process.env.DEV_MODE || 'false').toLowerCase() === 'true';
const EMAIL_ENABLED = Boolean(process.env.MAIL_USERNAME && process.env.MAIL_PASSWORD && process.env.MAIL_DEFAULT_SENDER && !DEV_MODE);

let transporter;
function getTransporter() {
  if (!EMAIL_ENABLED) {
    return null;
  }

  if (transporter) {
    return transporter;
  }

  const port = Number(process.env.MAIL_PORT || 587);
  const useTLS = String(process.env.MAIL_USE_TLS || 'true').toLowerCase() === 'true';
  
  transporter = nodemailer.createTransport({
    host: process.env.MAIL_SERVER || 'smtp.gmail.com',
    port: port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD
    },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 10000
  });

  return transporter;
}

async function sendEmail(to, subject, text) {
  const transport = getTransporter();
  if (!transport) {
    return false;
  }

  try {
    await transport.sendMail({
      from: process.env.MAIL_DEFAULT_SENDER,
      to,
      subject,
      text
    });
    return true;
  } catch (error) {
    console.warn('Unable to send email:', error);
    return false;
  }
}

module.exports = { sendEmail, EMAIL_ENABLED, DEV_MODE };
