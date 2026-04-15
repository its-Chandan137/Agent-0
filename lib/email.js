import nodemailer from 'nodemailer';

let cachedTransporter;

function getBrevoConfig() {
  const host = process.env.BREVO_SMTP_HOST;
  const port = Number(process.env.BREVO_SMTP_PORT || 587);
  const user = process.env.BREVO_SMTP_USER;
  const pass = process.env.BREVO_SMTP_PASS;
  const from = process.env.BREVO_FROM_EMAIL;

  if (!host || !port || !user || !pass || !from) {
    throw new Error('Missing Brevo SMTP environment variables.');
  }

  return { host, port, user, pass, from };
}

function getTransporter() {
  const config = getBrevoConfig();

  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });
  }

  return {
    transporter: cachedTransporter,
    from: config.from,
  };
}

export async function sendOtpEmail({ email, otp }) {
  const { transporter, from } = getTransporter();

  await transporter.sendMail({
    from: `Mantra <${from}>`,
    to: email,
    subject: 'Your Mantra OTP',
    text: `Your Mantra OTP is: ${otp}. Valid for 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #171717;">
        <p>Your Mantra OTP is:</p>
        <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px; margin: 12px 0;">${otp}</p>
        <p>It is valid for 10 minutes.</p>
      </div>
    `,
  });
}
