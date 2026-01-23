const express = require("express");
const cors = require("cors");
const routes = require("./routes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Hospital Management System API is running",
  });
});

// Routes
app.use("/api", routes);

// Handling errors
app.use(errorHandler);

module.exports = app;
