
// index.js  ✅ (Local dev only)
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 8080;

(async () => {
  await connectDB();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running at http://0.0.0.0:${PORT}`);
  });
})();
