const sgMail = require("@sendgrid/mail");

const apiKey = process.env.SENDGRID_API_KEY;

if (!apiKey) {
  throw new Error("❌ SENDGRID_API_KEY is missing in environment variables");
}

sgMail.setApiKey(apiKey);

/**
 * Safe email sender wrapper
 */
const send = async ({ to, from, subject, html, text }) => {
  try {
    if (!to || !from || !subject) {
      throw new Error("Missing required email fields (to, from, subject)");
    }

    const msg = {
      to,
      from,
      subject,

      // IMPORTANT: always prefer HTML
      html: html || undefined,

      // fallback text version (prevents spam filtering issues)
      text: text || "Please view this email in HTML format",
    };

    const response = await sgMail.send(msg);

    console.log("📩 Email sent successfully:", to);

    return response;
  } catch (error) {
    console.error("❌ Email send failed:");

    if (error.response) {
      console.error(error.response.body);
    } else {
      console.error(error.message);
    }

    throw error;
  }
};

module.exports = {
  send,
};