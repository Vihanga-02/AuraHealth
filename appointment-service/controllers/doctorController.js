// const { Doctor } = require("../models/Doctor");

// const getDoctors = async (req, res) => {
//   try {
//     const { specialty, search, location } = req.query;
//     const rows = await Doctor.findAll({ specialty, search, location });
//     return res.json(rows);
//   } catch (error) {
//     return res.status(500).json({ message: "Failed to fetch doctors", error: error.message });
//   }
// };

// module.exports = { getDoctors };

