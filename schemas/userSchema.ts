const userSchema = `
  CREATE TABLE IF NOT EXISTS users (
    userId   TEXT    PRIMARY KEY,
    email    TEXT    NOT NULL UNIQUE,
    password TEXT    NOT NULL
  );
`;

export default userSchema;