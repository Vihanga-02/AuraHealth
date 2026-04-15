const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const db = require("./config/db");
const appointmentRoutes = require("./routes/appointmentRoutes");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({ message: "Appointment service running" });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "appointment-service" });
});


app.use("/appointments", appointmentRoutes);

const PORT = process.env.PORT || 3006;

db.initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Appointment service running on port ${PORT}`);
  });
});
