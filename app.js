// app.js
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const router = require('./routes');
const { requestLogger, errorLogger } = require('./middleware/requestLogger');
const sitemapRoute = require("./routes/sitemap");

const app = express(); 
app.set('trust proxy', 1);
app.use(requestLogger);

// parse urlencoded
app.use(express.urlencoded({ extended: true }));

// parse json (json + text/plain)
app.use(express.json({
  limit: '2mb',
  type: (req) => {
    const ct = (req.headers['content-type'] || '').toLowerCase();
    return ct.includes('application/json') || ct.includes('text/plain');
  }
}));

// 🔧 Fallback: Buffer বা string এলে JSON অবজেক্টে কনভার্ট করো
app.use((req, res, next) => {
//   console.log({
//   origin: req.headers.origin,
//   hasRequestKey: Boolean(req.headers["x-client-key"]),
//   hasServerKey: Boolean(process.env.PUBLIC_CLIENT_KEY),
//   keyMatches:
//     req.headers["x-client-key"] === process.env.PUBLIC_CLIENT_KEY,
// });
  try {
    if (Buffer.isBuffer(req.body)) {
      const s = req.body.toString('utf8');
      try { req.body = JSON.parse(s); } catch { req.body = s; }
    } else if (typeof req.body === 'string') {
      try { req.body = JSON.parse(req.body); } catch {}
    }
  } catch {}
  next();
});

// CORS + cookies
// app.use(cors({ origin: ["http://localhost:5173", "http://127.0.0.1:5173"], credentials: true }));
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "https://pyzara.com",
      "https://www.pyzara.com",
    ],
    credentials: true,
  })
);
app.use(cookieParser());

// ✅ Dynamic sitemap route
app.use("/", sitemapRoute);

// Routes
app.use('/api', router);
// ⬇️ NEW: mount basic tracking routes
app.use('/api', require('./routes/trackBasic'));

// ⬇️ NEW: AI size recommendation route
app.use('/api', require('./routes/aiSizeRoute'));

// ⬇️ NEW: AI skincare recommendation route
app.use('/api', require('./routes/aiSkincareRoute'));

// Private S3 media upload routes
app.use('/api', require('./routes/mediaRoute'));

// Human customer support chat routes
app.use('/api', require('./routes/chatRoute'));
app.use('/api', require('./routes/adminChatRoute'));

// Health
app.get('/', (req, res) => res.send('✅ API is live!'));
app.use(errorLogger);

module.exports = app;
