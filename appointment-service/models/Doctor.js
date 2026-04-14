// const db = require("../config/db");

// const Doctor = {
//   findAll: async ({ specialty, search, location }) => {
//     let sql = `SELECT * FROM doctors WHERE 1=1`;
//     const params = [];
//     let index = 1;

//     if (specialty) {
//       sql += ` AND LOWER(specialty) LIKE LOWER($${index++})`;
//       params.push(`%${specialty}%`);
//     }

//     if (search) {
//       sql += ` AND (LOWER(name) LIKE LOWER($${index}) OR LOWER(specialty) LIKE LOWER($${index}))`;
//       params.push(`%${search}%`);
//       index++;
//     }

//     if (location) {
//       sql += ` AND LOWER(location) LIKE LOWER($${index++})`;
//       params.push(`%${location}%`);
//     }

//     sql += ` ORDER BY rating DESC, name ASC`;

//     const result = await db.query(sql, params);
//     return result.rows;
//   },
//   findById: async (id) => {
//     const result = await db.query(`SELECT * FROM doctors WHERE id = $1`, [id]);
//     return result.rows[0];
//   }
// };

// module.exports = { Doctor };
