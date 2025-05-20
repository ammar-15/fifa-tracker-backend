const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();
const authRoutes = require("./routes/authRoutes");
const { connectDB } = require('./db/db');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/", authRoutes);

connectDB();

app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});
