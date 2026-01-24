const nodemailer = require("nodemailer");

let transporter;

function getTransporter() {
  if (transporter) return transporter;

  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_SECURE } =
    process.env;

  if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASS) {
    console.info("Email transport not configured. Skipping email send.");
    return null;
  }

  transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: Number(EMAIL_PORT) || 587,
    secure: EMAIL_SECURE === "true" || EMAIL_SECURE === true,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  return transporter;
}

async function sendAppointmentEmail({ to, subject, text, html }) {
  const tx = getTransporter();
  if (!tx) {
    return { sent: false, skipped: true };
  }

  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  await tx.sendMail({ from, to, subject, text, html });
  return { sent: true, skipped: false };
}

module.exports = {
  sendAppointmentEmail,
};
