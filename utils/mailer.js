const sgMail = require("@sendgrid/mail");

const apiKey = process.env.SENDGRID_API_KEY;

if (apiKey) {
  sgMail.setApiKey(apiKey);
} else {
  console.warn("⚠️ SendGrid not configured");
}

module.exports = sgMail;