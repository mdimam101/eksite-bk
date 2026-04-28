// api/index.js 

const app = require('../app');
const connectDB = require('../config/db');


connectDB();

module.exports = app; // ✅ এটা দিতে হবে