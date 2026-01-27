const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const { sendAppointmentEmail } = require("../src/services/emailService");

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--to" || a === "-t") args.to = argv[++i];
    else args._ = args._ ? [...args._, a] : [a];
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv);
  const to = args.to || process.env.EMAIL_USER;

  if (!to) {
    console.error(
      "Missing recipient. Set EMAIL_USER in .env or pass --to you@example.com",
    );
    process.exitCode = 1;
    return;
  }

  const result = await sendAppointmentEmail({
    to,
    subject: "PulsePoint test email",
    text: "This is a test email from PulsePoint SMTP configuration.",
  });

  console.log("Email send result:", result);
}

main().catch((err) => {
  console.error("Test email failed:", err && err.message ? err.message : err);
  process.exitCode = 1;
});
