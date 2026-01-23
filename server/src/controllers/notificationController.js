const db = require("../config/database");

// Get all notifications for a user
exports.getNotifications = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await db.query(
      `
      SELECT * FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 50
    `,
      [userId],
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get unread notification count
exports.getUnreadCount = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await db.query(
      `
      SELECT COUNT(*) as count FROM notifications
      WHERE user_id = $1 AND is_read = FALSE
    `,
      [userId],
    );

    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const result = await db.query(
      `
      UPDATE notifications SET is_read = TRUE
      WHERE notification_id = $1
      RETURNING *
    `,
      [notificationId],
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mark all as read
exports.markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.params;

    await db.query(
      `
      UPDATE notifications SET is_read = TRUE
      WHERE user_id = $1 AND is_read = FALSE
    `,
      [userId],
    );

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create notification (manual)
exports.createNotification = async (req, res) => {
  try {
    const { user_id, title, message, type, related_appointment_id } = req.body;

    const result = await db.query(
      `
      INSERT INTO notifications (user_id, title, message, type, related_appointment_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
      [user_id, title, message, type || "info", related_appointment_id],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
