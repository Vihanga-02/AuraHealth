const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST || "patient-db",
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "patient_db"
});

const initDB = async () => {
  try {
    await pool.query("SELECT 1");
    console.log("Patient PostgreSQL connected");
  } catch (error) {
    console.error("Patient DB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  initDB
};
