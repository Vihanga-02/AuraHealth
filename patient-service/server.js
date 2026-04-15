const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const db = require("./config/db");
const patientRoutes = require("./routes/patientRoutes");
const { verifyToken } = require("./middleware/authMiddleware");

dotenv.config();

const app = express();
const uploadsPath = path.join(__dirname, "uploads", "reports");
fs.mkdirSync(uploadsPath, { recursive: true });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.json({ message: "Standalone Patient Service is running" });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "patient-service-standalone" });
});

app.use("/patients", patientRoutes);

app.use((err, req, res, next) => {
  if (err && err.message) {
    return res.status(400).json({ message: err.message });
  }
  next();
});

const PORT = process.env.PORT || 5003;

db.initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Standalone Patient Service running on port ${PORT}`);
  });
});
