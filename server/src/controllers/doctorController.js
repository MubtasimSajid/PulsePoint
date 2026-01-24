const db = require("../config/database");

exports.getAllDoctors = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT u.*, d.doctor_code, d.consultation_fee, d.license_number, d.experience_years, d.qualification,
        ARRAY_AGG(DISTINCT s.spec_name) FILTER (WHERE s.spec_name IS NOT NULL) as specializations,
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
      GROUP BY u.user_id, d.doctor_code, d.consultation_fee, d.license_number, d.experience_years, d.qualification
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
      SELECT u.*, d.doctor_code, d.consultation_fee, d.license_number, d.experience_years, d.qualification,
        ARRAY_AGG(DISTINCT s.spec_name) FILTER (WHERE s.spec_name IS NOT NULL) as specializations,
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
      GROUP BY u.user_id, d.doctor_code, d.consultation_fee, d.license_number, d.experience_years, d.qualification
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
      date_of_birth,
      dob,
      gender,
      address,
      doctor_code,
      consultation_fee,
      specializations,
      degrees,
      license_number,
      experience_years,
      qualification,
    } = req.body;

    const specializationIds = Array.isArray(specializations)
      ? specializations
      : specializations
        ? [specializations]
        : [];

    // Create user
    const userResult = await client.query(
      "INSERT INTO users (full_name, email, phone, date_of_birth, gender, address, role) VALUES ($1, $2, $3, $4, $5, $6, 'doctor') RETURNING user_id",
      [full_name, email, phone, date_of_birth || dob, gender, address],
    );
    const userId = userResult.rows[0].user_id;

    // Create doctor
    await client.query(
      "INSERT INTO doctors (user_id, doctor_code, consultation_fee, license_number, experience_years, qualification) VALUES ($1, $2, $3, $4, $5, $6)",
      [userId, doctor_code, consultation_fee, license_number, experience_years, qualification],
    );

    // Add specializations
    if (specializationIds.length > 0) {
      for (const specId of specializationIds) {
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
      SELECT u.*, d.doctor_code, d.consultation_fee, d.license_number, d.experience_years, d.qualification
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
      date_of_birth,
      dob,
      gender,
      address,
      doctor_code,
      consultation_fee,
      license_number,
      experience_years,
      qualification,
      specializations,
    } = req.body;

    const specializationIds = Array.isArray(specializations)
      ? specializations
      : specializations
        ? [specializations]
        : [];

    // Update user
    await client.query(
      "UPDATE users SET full_name = $1, email = $2, phone = $3, date_of_birth = $4, gender = $5, address = $6, updated_at = CURRENT_TIMESTAMP WHERE user_id = $7",
      [full_name, email, phone, date_of_birth || dob, gender, address, id],
    );

    // Update doctor
    await client.query(
      "UPDATE doctors SET doctor_code = $1, consultation_fee = $2, license_number = $3, experience_years = $4, qualification = $5 WHERE user_id = $6",
      [doctor_code, consultation_fee, license_number, experience_years, qualification, id],
    );

    // Replace specializations if provided
    if (specializationIds.length > 0) {
      await client.query("DELETE FROM doctor_specializations WHERE doctor_id = $1", [id]);
      for (const specId of specializationIds) {
        await client.query(
          "INSERT INTO doctor_specializations (doctor_id, spec_id) VALUES ($1, $2)",
          [id, specId],
        );
      }
    }

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
