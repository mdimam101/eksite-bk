// utils/verify.js
require('dotenv').config();
const twilio = require('twilio');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const service = () => client.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID);

async function sendOtp(to) {
  // E.164 ফরম্যাট: +81...
  return service().verifications.create({ to, channel: 'sms' });
}

async function checkOtp(to, code) {
  return service().verificationChecks.create({ to, code });
}

module.exports = { sendOtp, checkOtp };
