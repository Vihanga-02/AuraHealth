const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST || "appointment-db",
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "appointment_db"
});

const initDB = async () => {
  try {
    await pool.query("SELECT 1");
    console.log("Appointment PostgreSQL connected");
  } catch (error) {
    console.error("Appointment DB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  initDB
};
