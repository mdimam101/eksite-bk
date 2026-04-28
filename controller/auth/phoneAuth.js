// controller/auth/phoneAuth.js (MIN)
const jwt = require('jsonwebtoken');
const { sendOtp, checkOtp } = require('../../utils/verify');

exports.requestOtp = async (req, res) => {
  try {
    const phone = String(req.body?.phone || '').trim();
    if (!phone) return res.status(400).json({ success: false, message: 'Phone required' });
    const r = await sendOtp(phone);
    return res.json({ success: true, status: r.status }); // pending
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message || 'Failed to send OTP' });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const phone = String(req.body?.phone || '').trim();
    const code  = String(req.body?.code  || '').trim();
    if (!phone || !code) return res.status(400).json({ success: false, message: 'Phone & code required' });

    const r = await checkOtp(phone, code);
    if (r.status === 'approved') {
      // (optional) JWT ইস্যু করতে চাইলে:
      const token = jwt.sign({ phone }, process.env.TOKEN_SECRET_KEY, { expiresIn: '30d' });
      return res.json({ success: true, approved: true, token });
    }
    return res.status(400).json({ success: false, message: 'Invalid or expired code' });
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message || 'Verification failed' });
  }
};
