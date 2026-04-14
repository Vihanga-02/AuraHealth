const jwt = require("jsonwebtoken");
const db = require("../config/db");

const verifyToken = async (req, res, next) => {
  // Mock user for standalone mode
  req.user = {
    id: 1,
    name: "Default Patient",
    email: "patient@example.com",
    role: "PATIENT"
  };

  const authHeader = req.headers.authorization || "";
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (error) {
       console.log("Mock Auth (Appointment): Invalid token, using default user");
    }
  }
  next();
};

const allowRoles = (...roles) => {
  return (req, res, next) => {
    // In standalone mode, we allow all roles for now
    next();
  };
};

const allowAppointmentOwnerOrRoles = (...roles) => {
  return async (req, res, next) => {
    try {
      if (req.user && roles.includes(req.user.role)) {
        return next();
      }

      const result = await db.query(`SELECT * FROM appointments WHERE id = $1`, [req.params.id]);
      const appointment = result.rows[0];

      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      if (Number(appointment.patient_user_id) !== Number(req.user.id)) {
        return res.status(403).json({ message: "You can only access your own appointment" });
      }

      req.appointment = appointment;
      next();
    } catch (error) {
      return res.status(500).json({ message: "Authorization failed", error: error.message });
    }
  };
};

module.exports = {
  verifyToken,
  allowRoles,
  allowAppointmentOwnerOrRoles
};
