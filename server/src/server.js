require("dotenv").config();
const app = require("./app");
const db = require("./config/database");

const PORT = process.env.PORT || 5000;

// Test database connection
db.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("Database connection error:", err);
  } else {
    console.log("Database connected successfully");
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
