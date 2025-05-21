
const { Sequelize } = require('sequelize');
const config = require("./config");

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'db/database.sqlite'
})

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to SQLite via Sequelize');
  } catch (err) {
    console.error('Unable to connect to the database:', err);
  }
};

module.exports = { sequelize, connectDB };
