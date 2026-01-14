require('dotenv').config();
const app = require('./app');
const sequelize = require('./config/database');

const PORT = process.env.PORT || 5000;

// Database connection
sequelize.authenticate()
  .then(() => {
    console.log("Database connected");
    // TODO: Make it production-ready/safe
    return sequelize.sync({ alter: true });
  })
  .then(() => {
    app.listen(() => {
      console.log(`Server started on port ${PORT}`);
    })
  })
  .catch(err => {
    console.log("Failed to connect to database. Error: " + err);
  });
