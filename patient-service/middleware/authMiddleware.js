const jwt = require("jsonwebtoken");
const db = require("../config/db");

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Access token required" });
  }

  const token = authHeader.slice("Bearer ".length).trim();
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (_error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access forbidden: insufficient permissions" });
    }
    return next();
  };
};

const allowPatientOwnerOrRoles = (...roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (roles.includes(req.user.role)) {
        return next();
      }

      if (req.user.role !== "Patient") {
        return res.status(403).json({ message: "Forbidden" });
      }

      const result = await db.query(
        `SELECT
           id AS "_id",
           user_id AS "userId",
           full_name AS "fullName",
           email,
           phone,
           date_of_birth AS "dateOfBirth",
           gender,
           address,
           blood_group AS "bloodGroup",
           allergies,
           chronic_conditions AS "chronicConditions",
           emergency_contact_name AS "emergencyContactName",
           emergency_contact_phone AS "emergencyContactPhone",
           created_at AS "createdAt",
           updated_at AS "updatedAt"
         FROM patients
         WHERE id = $1`,
        [req.params.id]
      );

      const patient = result.rows[0];

      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      if (Number(patient.userId) !== Number(req.user.id)) {
        return res.status(403).json({ message: "You can only access your own records" });
      }

      req.patient = patient;
      next();
    } catch (error) {
      return res.status(500).json({
        message: "Authorization check failed",
        error: error.message
      });
    }
  };
};

module.exports = { authenticateToken, authorizeRoles, allowPatientOwnerOrRoles };
