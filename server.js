// server.js লোকাল/VM রান করার জন্য
require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 8080;

connectDB()
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ Server running at http://0.0.0.0:${PORT}`);
    });
  })
  .catch(() => {
    process.exit(1);
  });
