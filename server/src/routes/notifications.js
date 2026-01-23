const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");

router.get("/user/:userId", notificationController.getNotifications);
router.get("/user/:userId/unread-count", notificationController.getUnreadCount);
router.put("/:notificationId/read", notificationController.markAsRead);
router.put("/user/:userId/read-all", notificationController.markAllAsRead);
router.post("/", notificationController.createNotification);

module.exports = router;
