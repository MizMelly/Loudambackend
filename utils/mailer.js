const sgMail = require("@sendgrid/mail");

if (!process.env.SENDGRID_API_KEY) {
  console.error("❌ SENDGRID_API_KEY is missing in environment variables");
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

module.exports = sgMail;