const db = require("../config/database");

function isAdmin(user) {
  return user?.role === "admin";
}

function canActOnUser(reqUser, targetUserId) {
  if (!reqUser) return false;
  if (isAdmin(reqUser)) return true;
  return String(reqUser.userId) === String(targetUserId);
}

function normalizeDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return value;
}

exports.getAllUsers = async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM users ORDER BY user_id DESC");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query("SELECT * FROM users WHERE user_id = $1", [
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { full_name, email, phone, date_of_birth, dob, address, gender } =
      req.body;

    const result = await db.query(
      "INSERT INTO users (full_name, email, phone, date_of_birth, gender, address) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [
        full_name,
        email,
        phone,
        normalizeDate(date_of_birth || dob),
        gender,
        address,
      ],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!canActOnUser(req.user, id)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const { full_name, email, phone, date_of_birth, dob, address, gender } =
      req.body;

    const existing = await db.query(
      "SELECT full_name, email, phone, date_of_birth, gender, address FROM users WHERE user_id = $1",
      [id],
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const current = existing.rows[0];

    // Non-admin users can only update address (profile fields are locked post-registration).
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
      ? (normalizeDate(date_of_birth || dob) ?? current.date_of_birth)
      : current.date_of_birth;
    const nextGender = isAdmin(req.user)
      ? (gender ?? current.gender)
      : current.gender;
    const nextAddress = address ?? current.address;

    const result = await db.query(
      "UPDATE users SET full_name = $1, email = $2, phone = $3, date_of_birth = $4, gender = $5, address = $6, updated_at = CURRENT_TIMESTAMP WHERE user_id = $7 RETURNING *",
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

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!canActOnUser(req.user, id)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const result = await db.query(
      "DELETE FROM users WHERE user_id = $1 RETURNING *",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
