import { Sequelize } from "sequelize";

export const sequelize = new Sequelize("sqlite::memory:", {
  logging: false, // Disable SQL logging for cleaner test output
});
