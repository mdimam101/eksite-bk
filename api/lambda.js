// // api/lambda.js
// // ✅ Wrap your existing Express app for AWS Lambda using serverless-http

// const app = require('../app'); // <-- your current app.js that exports the Express instance
// const serverless = require('serverless-http');

// // Optional: tell serverless-http about binary uploads if you ever use file upload
// module.exports.handler = serverless(app, {
//   binary: ['multipart/form-data', 'image/*', 'application/octet-stream']
// });

// api/lambda.js  ✅ (Lambda handler)
const serverless = require('serverless-http');
const app = require('../app');
const connectDB = require('../config/db');

let cachedHandler;

exports.handler = async (event, context) => {
  // Ensure DB is connected once per container
  await connectDB();

  
    cachedHandler = serverless(app);
  
  return cachedHandler(event, context);
};
