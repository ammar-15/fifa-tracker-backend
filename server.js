const { Sequelize } = require('sequelize');
const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const cors = require("cors");
const port = process.env.PORT;

const app = express();
const sequelize = new Sequelize('sqlite::memory:')

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});

try {
  sequelize.authenticate();
  console.log('Connection has been established successfully.');
} catch (error) {
  console.error('Unable to connect to the database:', error);
}