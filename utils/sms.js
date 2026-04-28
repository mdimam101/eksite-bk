// 🔰 Make sure .env loads even if this file is required before app.js
// utils/sms.js
require('dotenv').config();
const twilio = require('twilio');

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
  TWILIO_MESSAGING_SERVICE_SID,
  TWILIO_DISABLED
} = process.env;

// robust disable flag
const disabled = ['1','true','yes','on'].includes(String(TWILIO_DISABLED || '').toLowerCase());

let client = null;
if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && !disabled) {
  client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN); // ✅ no RequestClient/deep import
  console.log('📨 Twilio SMS transport enabled');
} else {
  console.log(
    `🧪 Dev SMS transport enabled (console only). sid=${!!TWILIO_ACCOUNT_SID}, token=${!!TWILIO_AUTH_TOKEN}, disabled=${disabled}`
  );
}

async function sendSMS(to, body) {
  if (!client) {
    console.log(`(DEV SMS) to=${to} :: ${body}`);
    return 'dev-sms-sid';
  }

  const params = { to, body };
  if (TWILIO_MESSAGING_SERVICE_SID) {
    params.messagingServiceSid = TWILIO_MESSAGING_SERVICE_SID; // ✅ Service থাকলে 'from' পাঠাবে না
  } else {
    params.from = TWILIO_PHONE_NUMBER; // ✅ Twilio-owned SMS-capable number
  }

  console.log('🛰️ Twilio creating message...', { to, usingService: !!TWILIO_MESSAGING_SERVICE_SID });

  try {
    // ⏱️ Hard cap: Twilio কল 8s+ লম্বা হলে টাইমআউট করে ফেলি (Lambda hang আটকাতে)
    const sid = await Promise.race([
      client.messages.create(params).then(m => m.sid),
      new Promise((_, rej) => setTimeout(() => rej(new Error('TWILIO_SEND_TIMEOUT')), 8000))
    ]);
    console.log('✅ Twilio message SID:', sid);
    return sid;
  } catch (err) {
    // helpful logs
    const code = err?.code;
    const more = err?.moreInfo;
    console.error('❌ Twilio send error:', err?.message || err, { code, more });
    throw err;
  }
}

module.exports = { sendSMS };
