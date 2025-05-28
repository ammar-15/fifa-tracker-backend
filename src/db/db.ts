import { Sequelize } from "sequelize";
import config from "./config";

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "db/database.sqlite",
});

export const connectDB = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log("Connected to SQLite via Sequelize");
  } catch (err) {
    console.error("Unable to connect to the database:", err);
  }
};

export { sequelize };