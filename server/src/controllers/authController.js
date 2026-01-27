const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const pool = require("../config/database");

const JWT_SECRET =
  process.env.JWT_SECRET || crypto.randomBytes(32).toString("hex");
const JWT_EXPIRES_IN = "7d";
const ALLOWED_ROLES = ["patient", "doctor", "hospital_admin", "admin"];

function sanitizeHeightCm(value) {
  const num = parseFloat(value);
  if (!Number.isFinite(num)) return null;
  return num >= 30 && num <= 300 ? num : null;
}

function sanitizeWeightKg(value) {
  const num = parseFloat(value);
  if (!Number.isFinite(num)) return null;
  return num > 0 && num <= 500 ? num : null;
}

function normalizeDate(value) {
  if (!value) return null;
  // Reject empty-string or invalid dates
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return value;
}

// Register new user
exports.register = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      email,
      password,
      full_name,
      phone,
      date_of_birth,
      dob,
      gender,
      address,
      role = "patient",
    } = req.body;

    const normalizedRole = (role || "patient").toLowerCase();

    const hospitalName =
      normalizedRole === "hospital_admin" ? req.body?.hospital_name : null;
    const derivedFullName =
      full_name || (normalizedRole === "hospital_admin" ? hospitalName : null);

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    if (normalizedRole === "hospital_admin") {
      if (!hospitalName) {
        return res.status(400).json({ error: "Hospital name is required" });
      }
    } else {
      if (!derivedFullName) {
        return res.status(400).json({ error: "Full name is required" });
      }
    }

    if (!ALLOWED_ROLES.includes(normalizedRole)) {
      return res.status(400).json({ error: "Invalid role supplied" });
    }

    // Check if user already exists
    const existingUser = await client.query(
      "SELECT * FROM users WHERE email = $1",
      [email],
    );

    if (existingUser.rows.length > 0) {
      return res
        .status(409)
        .json({ error: "User with this email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    await client.query("BEGIN");

    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, full_name, phone, date_of_birth, gender, address, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
       RETURNING user_id, email, full_name, phone, date_of_birth, gender, address, role, created_at`,
      [
        email,
        hashedPassword,
        derivedFullName,
        phone || null,
        normalizeDate(date_of_birth || dob),
        gender,
        address,
        normalizedRole,
      ],
    );

    const user = userResult.rows[0];

    // If role is patient, create patient record
    if (normalizedRole === "patient") {
      const {
        patient_code,
        height_cm,
        weight_kg,
        blood_group,
        medical_notes,
        emergency_contact,
      } = req.body;

      const safeHeight = sanitizeHeightCm(height_cm);
      const safeWeight = sanitizeWeightKg(weight_kg);

      await client.query(
        "INSERT INTO patients (user_id, patient_code, height_cm, weight_kg, blood_group, medical_notes, emergency_contact) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [
          user.user_id,
          patient_code || null,
          safeHeight,
          safeWeight,
          blood_group,
          medical_notes,
          emergency_contact || phone,
        ],
      );
    }

    // If role is doctor, create doctor record
    if (normalizedRole === "doctor") {
      const {
        doctor_code,
        consultation_fee,
        license_number,
        specialization_id,
        specialization_ids,
        specializations,
        experience_years,
        qualification,
      } = req.body;

      const specializationListRaw =
        specialization_ids ||
        specializations ||
        (specialization_id ? [specialization_id] : []);
      const specializationList = Array.isArray(specializationListRaw)
        ? specializationListRaw
        : [specializationListRaw].filter(Boolean);
      const primarySpecialization =
        specializationList.length > 0 ? specializationList[0] : null;

      await client.query(
        "INSERT INTO doctors (user_id, doctor_code, consultation_fee, license_number, specialization_id, experience_years, qualification) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [
          user.user_id,
          doctor_code,
          consultation_fee,
          license_number,
          primarySpecialization,
          experience_years,
          qualification,
        ],
      );

      if (specializationList.length > 0) {
        for (const specId of specializationList) {
          await client.query(
            "INSERT INTO doctor_specializations (doctor_id, spec_id) VALUES ($1, $2)",
            [user.user_id, specId],
          );
        }
      }
    }

    // If role is hospital admin, create or defer hospital onboarding
    if (normalizedRole === "hospital_admin") {
      const {
        hospital_name,
        hospital_license_number,
        hospital_tax_id,
        hospital_type,
        hospital_category,
        hospital_specialty,
        hospital_website_url,
        hospital_branch_addresses,
      } = req.body;

      const branchAddresses = Array.isArray(hospital_branch_addresses)
        ? hospital_branch_addresses
        : [];

      if (!hospital_license_number) {
        return res
          .status(400)
          .json({ error: "Registration/License number is required" });
      }
      if (!hospital_tax_id) {
        return res.status(400).json({ error: "Tax ID / EIN is required" });
      }
      if (!hospital_type) {
        return res.status(400).json({ error: "Hospital type is required" });
      }
      if (!hospital_category) {
        return res.status(400).json({ error: "Hospital category is required" });
      }
      if (hospital_category === "single_specialty" && !hospital_specialty) {
        return res
          .status(400)
          .json({
            error: "Specialty is required for single specialty hospitals",
          });
      }
      if (!hospital_website_url) {
        return res.status(400).json({ error: "Website URL is required" });
      }

      // Backward-compat: accept a single address string if the old payload is used.
      if (branchAddresses.length === 0 && req.body?.hospital_address) {
        branchAddresses.push(req.body.hospital_address);
      }

      const cleanedBranchAddresses = branchAddresses
        .map((v) => (typeof v === "string" ? v.trim() : ""))
        .filter(Boolean);

      if (cleanedBranchAddresses.length === 0) {
        return res
          .status(400)
          .json({ error: "At least one branch address is required" });
      }

      // Create one row per branch so existing appointment/hospital selection keeps working.
      for (let i = 0; i < cleanedBranchAddresses.length; i++) {
        await client.query(
          `INSERT INTO hospitals (
            admin_user_id,
            name,
            est_year,
            email,
            phone,
            address,
            license_number,
            tax_id,
            hospital_type,
            category,
            specialty,
            website_url,
            location
          )
          VALUES ($1, $2, NULL, $3, NULL, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            user.user_id,
            hospital_name,
            email,
            cleanedBranchAddresses[i],
            hospital_license_number,
            hospital_tax_id,
            hospital_type,
            hospital_category,
            hospital_specialty || null,
            hospital_website_url,
            `Branch ${i + 1}`,
          ],
        );
      }
    }

    await client.query("COMMIT");

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.user_id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
    );

    const onboarding = await buildOnboardingStatus(user.user_id, user.role);

    res.status(201).json({
      message: "User registered successfully",
      user: {
        user_id: user.user_id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        phone: user.phone,
        date_of_birth: user.date_of_birth,
        gender: user.gender,
        address: user.address,
      },
      onboarding,
      token,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Registration error:", error);
    res
      .status(500)
      .json({ error: "Failed to register user", details: error.message });
  } finally {
    client.release();
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = result.rows[0];

    // Check if user is active
    if (!user.is_active) {
      return res
        .status(403)
        .json({ error: "Account is deactivated. Please contact support." });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Update last login
    await pool.query(
      "UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE user_id = $1",
      [user.user_id],
    );

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.user_id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
    );

    const onboarding = await buildOnboardingStatus(user.user_id, user.role);

    res.json({
      message: "Login successful",
      user: {
        user_id: user.user_id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        phone: user.phone,
        date_of_birth: user.date_of_birth,
        gender: user.gender,
        address: user.address,
      },
      onboarding,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Failed to login", details: error.message });
  }
};

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT user_id, email, full_name, phone, date_of_birth, gender, address, role, created_at
       FROM users WHERE user_id = $1`,
      [userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = result.rows[0];

    // Get additional info based on role
    if (user.role === "patient") {
      const patientInfo = await pool.query(
        "SELECT patient_code, height_cm, weight_kg, bmi, blood_group, medical_notes, emergency_contact FROM patients WHERE user_id = $1",
        [userId],
      );
      if (patientInfo.rows.length > 0) {
        user.patient_info = patientInfo.rows[0];
      }
    }

    if (user.role === "doctor") {
      const doctorInfo = await pool.query(
        `SELECT d.user_id, d.doctor_code, d.consultation_fee, d.license_number, d.experience_years, d.qualification,
                ARRAY_AGG(s.spec_name) FILTER (WHERE s.spec_name IS NOT NULL) AS specializations
         FROM doctors d
         LEFT JOIN doctor_specializations ds ON ds.doctor_id = d.user_id
         LEFT JOIN specializations s ON ds.spec_id = s.spec_id
         WHERE d.user_id = $1
         GROUP BY d.user_id, d.doctor_code, d.consultation_fee, d.license_number, d.experience_years, d.qualification`,
        [userId],
      );
      if (doctorInfo.rows.length > 0) {
        user.doctor_info = doctorInfo.rows[0];
      }
    }

    if (user.role === "hospital_admin") {
      const hospitalInfo = await pool.query(
        `SELECT hospital_id, name, est_year, email, phone, address, license_number
         FROM hospitals
         WHERE admin_user_id = $1`,
        [userId],
      );

      if (hospitalInfo.rows.length > 0) {
        user.hospital = hospitalInfo.rows[0];
      }
    }

    res.json(user);
  } catch (error) {
    console.error("Get profile error:", error);
    res
      .status(500)
      .json({ error: "Failed to get profile", details: error.message });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { full_name, phone, date_of_birth, gender, address } = req.body;

    const result = await pool.query(
      `UPDATE users 
       SET full_name = COALESCE($1, full_name),
           phone = COALESCE($2, phone),
           date_of_birth = COALESCE($3, date_of_birth),
           gender = COALESCE($4, gender),
           address = COALESCE($5, address),
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $6
       RETURNING user_id, email, full_name, phone, date_of_birth, gender, address, role`,
      [full_name, phone, date_of_birth, gender, address, userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message: "Profile updated successfully",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res
      .status(500)
      .json({ error: "Failed to update profile", details: error.message });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Current password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "New password must be at least 6 characters long" });
    }

    // Get current password hash
    const result = await pool.query(
      "SELECT password_hash FROM users WHERE user_id = $1",
      [userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify current password
    const isValid = await bcrypt.compare(
      currentPassword,
      result.rows[0].password_hash,
    );

    if (!isValid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.query(
      "UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2",
      [hashedPassword, userId],
    );

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res
      .status(500)
      .json({ error: "Failed to change password", details: error.message });
  }
};

// Logout (client-side token removal)
exports.logout = async (req, res) => {
  res.json({ message: "Logout successful. Please remove token from client." });
};

// Determine whether the current user still owes onboarding/profile information
async function buildOnboardingStatus(userId, role) {
  const missing = [];
  const normalizedRole = (role || "").toLowerCase();

  if (normalizedRole === "patient") {
    const [userResult, patientResult] = await Promise.all([
      pool.query("SELECT date_of_birth FROM users WHERE user_id = $1", [
        userId,
      ]),
      pool.query(
        "SELECT height_cm, weight_kg, blood_group, emergency_contact FROM patients WHERE user_id = $1",
        [userId],
      ),
    ]);

    const patientRow = patientResult.rows[0];
    const userRow = userResult.rows[0];

    if (!patientRow) {
      missing.push("patient_profile");
    } else {
      if (!patientRow.height_cm) missing.push("height_cm");
      if (!patientRow.weight_kg) missing.push("weight_kg");
    }

    if (userRow && !userRow.date_of_birth) {
      missing.push("date_of_birth");
    }
  }

  if (normalizedRole === "doctor") {
    const doctorResult = await pool.query(
      "SELECT doctor_code, license_number, experience_years, qualification FROM doctors WHERE user_id = $1",
      [userId],
    );

    const specCountResult = await pool.query(
      "SELECT COUNT(*) FROM doctor_specializations WHERE doctor_id = $1",
      [userId],
    );

    const doctorRow = doctorResult.rows[0];
    if (!doctorRow) {
      missing.push("doctor_profile");
    } else {
      if (!doctorRow.license_number) missing.push("license_number");
      if (!doctorRow.qualification) missing.push("qualification");
      if (!doctorRow.experience_years) missing.push("experience_years");
    }

    if (parseInt(specCountResult.rows[0]?.count || "0", 10) === 0) {
      missing.push("specializations");
    }
  }

  if (normalizedRole === "hospital_admin") {
    const hospitalResult = await pool.query(
      "SELECT hospital_id FROM hospitals WHERE admin_user_id = $1",
      [userId],
    );

    if (hospitalResult.rows.length === 0) {
      missing.push("hospital_profile");
    }
  }

  return { required: missing.length > 0, missing_fields: missing };
}
