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

/**
 * Allows requests that either:
 *   (a) carry a matching x-internal-token header (service-to-service), OR
 *   (b) carry a valid JWT whose role is in the allowed list.
 *
 * IMPORTANT: do NOT chain authenticateToken before this middleware on the same
 * route – this function handles JWT verification itself when needed.
 */
const allowInternalOrRoles = (...roles) => {
  return (req, res, next) => {
    // ── Path A: internal service-to-service call ──────────────────────────
    const internalToken = (req.headers["x-internal-token"] || "").toString().trim();
    const configuredToken = (process.env.INTERNAL_SERVICE_TOKEN || "").trim();
    if (internalToken && configuredToken && internalToken === configuredToken) {
      return next();
    }

    // ── Path B: regular authenticated user with allowed role ─────────────
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Access token or internal token required" });
    }
    const token = authHeader.slice("Bearer ".length).trim();
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      return authorizeRoles(...roles)(req, res, next);
    } catch {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
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
  authenticateToken,
  authorizeRoles,
  allowInternalOrRoles,
  allowAppointmentOwnerOrRoles,
};
