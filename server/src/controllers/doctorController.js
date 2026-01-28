const db = require("../config/database");

function isAdmin(user) {
  return user?.role === "admin";
}

function canActOnUser(reqUser, targetUserId) {
  if (!reqUser) return false;
  if (isAdmin(reqUser)) return true;
  return String(reqUser.userId) === String(targetUserId);
}

exports.getAllDoctors = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT u.*, d.doctor_code, d.consultation_fee, d.license_number, d.experience_years, d.qualification, d.degrees,
        ARRAY_AGG(DISTINCT s.spec_name) FILTER (WHERE s.spec_name IS NOT NULL) as specializations
      FROM users u
      INNER JOIN doctors d ON u.user_id = d.user_id
      LEFT JOIN doctor_specializations ds ON d.user_id = ds.doctor_id
      LEFT JOIN specializations s ON ds.spec_id = s.spec_id
      GROUP BY u.user_id, d.doctor_code, d.consultation_fee, d.license_number, d.experience_years, d.qualification, d.degrees
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
      SELECT u.*, d.doctor_code, d.consultation_fee, d.license_number, d.experience_years, d.qualification, d.degrees,
        ARRAY_AGG(DISTINCT s.spec_name) FILTER (WHERE s.spec_name IS NOT NULL) as specializations
      FROM users u
      INNER JOIN doctors d ON u.user_id = d.user_id
      LEFT JOIN doctor_specializations ds ON d.user_id = ds.doctor_id
      LEFT JOIN specializations s ON ds.spec_id = s.spec_id
      WHERE u.user_id = $1
      GROUP BY u.user_id, d.doctor_code, d.consultation_fee, d.license_number, d.experience_years, d.qualification, d.degrees
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

    // Extract degree names if they are objects, or use as is if strings
    const degreeList = Array.isArray(degrees)
      ? degrees.map(d => typeof d === 'object' && d.degree_name ? d.degree_name : d).filter(Boolean)
      : [];

    // Create doctor
    await client.query(
      "INSERT INTO doctors (user_id, doctor_code, consultation_fee, license_number, experience_years, qualification, degrees) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [
        userId,
        doctor_code,
        consultation_fee,
        license_number,
        experience_years,
        qualification,
        degreeList
      ],
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

    if (!canActOnUser(req.user, id)) {
      await client.query("ROLLBACK");
      return res.status(403).json({ error: "Access denied" });
    }

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

    // Fetch existing user to preserve values when not provided
    const existingUser = await client.query(
      "SELECT full_name, email, phone, date_of_birth, gender, address FROM users WHERE user_id = $1",
      [id],
    );

    if (existingUser.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "User not found" });
    }

    const current = existingUser.rows[0];
    // Non-admin doctors: only address and consultation_fee are editable.
    const nextFullName = isAdmin(req.user)
      ? (full_name ?? current.full_name)
      : current.full_name;
    const nextEmail = isAdmin(req.user)
      ? (email ?? current.email)
      : current.email;
    const nextPhone = isAdmin(req.user)
      ? (phone ?? current.phone)
      : current.phone;
    const nextDob = isAdmin(req.user)
      ? ((date_of_birth || dob) ?? current.date_of_birth)
      : current.date_of_birth;
    const nextGender = isAdmin(req.user)
      ? (gender ?? current.gender)
      : current.gender;
    const nextAddress = address ?? current.address;

    // Update user
    await client.query(
      "UPDATE users SET full_name = $1, email = $2, phone = $3, date_of_birth = $4, gender = $5, address = $6, updated_at = CURRENT_TIMESTAMP WHERE user_id = $7",
      [
        nextFullName,
        nextEmail,
        nextPhone,
        nextDob,
        nextGender,
        nextAddress,
        id,
      ],
    );

    // Fetch existing doctor
    const existingDoctor = await client.query(
      "SELECT doctor_code, consultation_fee, license_number, experience_years, qualification FROM doctors WHERE user_id = $1",
      [id],
    );

    if (existingDoctor.rows.length === 0) {
      // If doctor record is missing, create it
      const safeDocCode = isAdmin(req.user) ? doctor_code : null;
      const safeFee = consultation_fee ?? null;
      const safeLicense = isAdmin(req.user) ? license_number : null;
      const safeExp = isAdmin(req.user) ? experience_years : null;
      const safeQual = isAdmin(req.user) ? qualification : null;

      await client.query(
        "INSERT INTO doctors (user_id, doctor_code, consultation_fee, license_number, experience_years, qualification) VALUES ($1, $2, $3, $4, $5, $6)",
        [id, safeDocCode, safeFee, safeLicense, safeExp, safeQual],
      );
    } else {
      const docCurrent = existingDoctor.rows[0];
      const nextDocCode = isAdmin(req.user)
        ? (doctor_code ?? docCurrent.doctor_code)
        : docCurrent.doctor_code;
      const nextFee = consultation_fee ?? docCurrent.consultation_fee;
      const nextLicense = isAdmin(req.user)
        ? (license_number ?? docCurrent.license_number)
        : docCurrent.license_number;
      const nextExp = isAdmin(req.user)
        ? (experience_years ?? docCurrent.experience_years)
        : docCurrent.experience_years;
      const nextQual = isAdmin(req.user)
        ? (qualification ?? docCurrent.qualification)
        : docCurrent.qualification;

      // Update doctor
      await client.query(
        "UPDATE doctors SET doctor_code = $1, consultation_fee = $2, license_number = $3, experience_years = $4, qualification = $5 WHERE user_id = $6",
        [nextDocCode, nextFee, nextLicense, nextExp, nextQual, id],
      );
    }

    // Replace specializations if provided
    if (isAdmin(req.user) && specializationIds.length > 0) {
      await client.query(
        "DELETE FROM doctor_specializations WHERE doctor_id = $1",
        [id],
      );
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

    if (!canActOnUser(req.user, id)) {
      return res.status(403).json({ error: "Access denied" });
    }

    await db.query("DELETE FROM doctors WHERE user_id = $1", [id]);
    await db.query("DELETE FROM users WHERE user_id = $1", [id]);

    res.json({ message: "Doctor deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
