const db = require("../config/database");

exports.getAllDoctors = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT u.*, d.doctor_code, d.consultation_fee,
        ARRAY_AGG(DISTINCT s.name) FILTER (WHERE s.name IS NOT NULL) as specializations,
        ARRAY_AGG(DISTINCT jsonb_build_object(
          'degree_name', dd.degree_name,
          'institution', dd.institution,
          'achievement_year', dd.achievement_year
        )) FILTER (WHERE dd.degree_name IS NOT NULL) as degrees
      FROM users u
      INNER JOIN doctors d ON u.user_id = d.user_id
      LEFT JOIN doctor_specializations ds ON d.user_id = ds.doctor_id
      LEFT JOIN specializations s ON ds.spec_id = s.spec_id
      LEFT JOIN doctor_degrees dd ON d.user_id = dd.doctor_id
      GROUP BY u.user_id, d.doctor_code, d.consultation_fee
      ORDER BY u.user_id DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `
      SELECT u.*, d.doctor_code, d.consultation_fee,
        ARRAY_AGG(DISTINCT s.name) FILTER (WHERE s.name IS NOT NULL) as specializations,
        ARRAY_AGG(DISTINCT jsonb_build_object(
          'degree_id', dd.degree_id,
          'degree_name', dd.degree_name,
          'institution', dd.institution,
          'achievement_year', dd.achievement_year
        )) FILTER (WHERE dd.degree_name IS NOT NULL) as degrees
      FROM users u
      INNER JOIN doctors d ON u.user_id = d.user_id
      LEFT JOIN doctor_specializations ds ON d.user_id = ds.doctor_id
      LEFT JOIN specializations s ON ds.spec_id = s.spec_id
      LEFT JOIN doctor_degrees dd ON d.user_id = dd.doctor_id
      WHERE u.user_id = $1
      GROUP BY u.user_id, d.doctor_code, d.consultation_fee
    `,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createDoctor = async (req, res) => {
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const {
      full_name,
      email,
      phone,
      dob,
      address,
      doctor_code,
      consultation_fee,
      specializations,
      degrees,
    } = req.body;

    // Create user
    const userResult = await client.query(
      "INSERT INTO users (full_name, email, phone, dob, address) VALUES ($1, $2, $3, $4, $5) RETURNING user_id",
      [full_name, email, phone, dob, address],
    );
    const userId = userResult.rows[0].user_id;

    // Create doctor
    await client.query(
      "INSERT INTO doctors (user_id, doctor_code, consultation_fee) VALUES ($1, $2, $3)",
      [userId, doctor_code, consultation_fee],
    );

    // Add specializations
    if (specializations && specializations.length > 0) {
      for (const specId of specializations) {
        await client.query(
          "INSERT INTO doctor_specializations (doctor_id, spec_id) VALUES ($1, $2)",
          [userId, specId],
        );
      }
    }

    // Add degrees
    if (degrees && degrees.length > 0) {
      for (const degree of degrees) {
        await client.query(
          "INSERT INTO doctor_degrees (doctor_id, degree_name, institution, achievement_year) VALUES ($1, $2, $3, $4)",
          [
            userId,
            degree.degree_name,
            degree.institution,
            degree.achievement_year,
          ],
        );
      }
    }

    await client.query("COMMIT");

    // Fetch and return the complete doctor
    const result = await db.query(
      `
      SELECT u.*, d.doctor_code, d.consultation_fee
      FROM users u
      INNER JOIN doctors d ON u.user_id = d.user_id
      WHERE u.user_id = $1
    `,
      [userId],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

exports.updateDoctor = async (req, res) => {
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const { id } = req.params;
    const {
      full_name,
      email,
      phone,
      dob,
      address,
      doctor_code,
      consultation_fee,
    } = req.body;

    // Update user
    await client.query(
      "UPDATE users SET full_name = $1, email = $2, phone = $3, dob = $4, address = $5 WHERE user_id = $6",
      [full_name, email, phone, dob, address, id],
    );

    // Update doctor
    await client.query(
      "UPDATE doctors SET doctor_code = $1, consultation_fee = $2 WHERE user_id = $3",
      [doctor_code, consultation_fee, id],
    );

    await client.query("COMMIT");

    const result = await db.query(
      `
      SELECT u.*, d.doctor_code, d.consultation_fee
      FROM users u
      INNER JOIN doctors d ON u.user_id = d.user_id
      WHERE u.user_id = $1
    `,
      [id],
    );

    res.json(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

exports.deleteDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM doctors WHERE user_id = $1", [id]);
    await db.query("DELETE FROM users WHERE user_id = $1", [id]);

    res.json({ message: "Doctor deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
