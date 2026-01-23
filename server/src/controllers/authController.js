const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/database");

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = "7d";

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
      gender,
      address,
      role = "patient",
    } = req.body;

    // Validate required fields
    if (!email || !password || !full_name) {
      return res
        .status(400)
        .json({ error: "Email, password, and full name are required" });
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
        full_name,
        phone,
        date_of_birth,
        gender,
        address,
        role,
      ],
    );

    const user = userResult.rows[0];

    // If role is patient, create patient record
    if (role === "patient") {
      await client.query(
        "INSERT INTO patients (user_id, blood_group, emergency_contact) VALUES ($1, $2, $3)",
        [user.user_id, null, phone],
      );
    }

    // If role is doctor, create doctor record
    if (role === "doctor") {
      const {
        license_number,
        specialization_id,
        experience_years,
        qualification,
      } = req.body;
      await client.query(
        "INSERT INTO doctors (user_id, license_number, specialization_id, experience_years, qualification) VALUES ($1, $2, $3, $4, $5)",
        [
          user.user_id,
          license_number,
          specialization_id,
          experience_years,
          qualification,
        ],
      );
    }

    await client.query("COMMIT");

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.user_id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
    );

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
        "SELECT blood_group, emergency_contact FROM patients WHERE user_id = $1",
        [userId],
      );
      if (patientInfo.rows.length > 0) {
        user.patient_info = patientInfo.rows[0];
      }
    }

    if (user.role === "doctor") {
      const doctorInfo = await pool.query(
        `SELECT d.*, s.spec_name 
         FROM doctors d
         LEFT JOIN specializations s ON d.specialization_id = s.spec_id
         WHERE d.user_id = $1`,
        [userId],
      );
      if (doctorInfo.rows.length > 0) {
        user.doctor_info = doctorInfo.rows[0];
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
