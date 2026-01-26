const nodemailer = require("nodemailer");

let transporter;

let etherealAccount;

async function getTransporter() {
  if (transporter) return transporter;

  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_SECURE } =
    process.env;

  // If SMTP isn't configured, fall back to an Ethereal test inbox in dev.
  // This allows verifying emails without real credentials.
  if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASS) {
    const env = String(process.env.NODE_ENV || "development").toLowerCase();
    if (env === "production") {
      console.info("Email transport not configured. Skipping email send.");
      return null;
    }

    if (!etherealAccount) {
      etherealAccount = await nodemailer.createTestAccount();
      console.info(
        `Using Ethereal test inbox for email: ${etherealAccount.user}`,
      );
    }

    transporter = nodemailer.createTransport({
      host: etherealAccount.smtp.host,
      port: etherealAccount.smtp.port,
      secure: etherealAccount.smtp.secure,
      auth: {
        user: etherealAccount.user,
        pass: etherealAccount.pass,
      },
    });

    return transporter;
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
  const tx = await getTransporter();
  if (!tx) {
    return { sent: false, skipped: true };
  }

  const from =
    process.env.EMAIL_FROM ||
    process.env.EMAIL_USER ||
    (etherealAccount ? etherealAccount.user : undefined);

  const info = await tx.sendMail({ from, to, subject, text, html });

  // When using Ethereal, log the preview URL so you can open it in the browser.
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.info(`Email preview: ${previewUrl}`);
  }

  return { sent: true, skipped: false, previewUrl };
}

module.exports = {
  sendAppointmentEmail,
};
