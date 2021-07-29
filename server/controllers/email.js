const sgMail = require('@sendgrid/mail');
const isEmail = require('validator/lib/isEmail');

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

class EmailCtrl {
  static async sendEmail (to, subject, html, fromName) {
    if (!to || !isEmail(to)) {
      throw new Error('Invalid email address', to);
    }

    const from = {
      email: process.env.EMAIL_FROM_ADDRESS,
      name: fromName
    };

    try {
      await sgMail.send({ from, to, subject, html });
      console.log(`Email sent to ${to}`);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}

module.exports = EmailCtrl;
