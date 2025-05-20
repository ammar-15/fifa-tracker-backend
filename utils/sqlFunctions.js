const { Sequelize } = require("sequelize");
const config = require("./db/db");

const db = new sqlite3.Database(Storage, (err) => {
  if (err) console.error("sqlite open error: ", error);
  else console.log("connected to sqlite", storage);
});

const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });

const get = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

const all = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

const createTable = (schema) => run(schema);

const checkRecordExists = (tableName, column, value) => {
  const sql = `SELECT * FROM ${tableName} WHERE ${column} = ?`;
  return get(sql, [value]);
};

const insertRecord = (tableName, record) => {
  const keys = Object.keys(record);
  const placeholders = keys.map(() => "?").join(",");
  const sql = `INSERT INTO ${tableName}(${keys.join(
    ","
  )}) VALUES(${placeholders})`;
  const values = Object.values(record);
  return run(sql, values);
};

module.exports = {
    createTable,
    checkRecordExists,
    insertRecord,
};