const express = require("express");
const router = express.Router();
const scheduleController = require("../controllers/scheduleController");
const { authenticate, authorize } = require("../middleware/auth");

router.get("/doctor/:doctorId", scheduleController.getDoctorSchedules);
router.post(
  "/",
  authenticate,
  authorize("doctor"),
  scheduleController.createDoctorSchedule,
);
router.get("/slots/:doctorId", scheduleController.getAvailableSlots);
router.post(
  "/generate-slots",
  authenticate,
  authorize("doctor"),
  scheduleController.generateSlots,
);
router.post(
  "/book-slot",
  authenticate,
  authorize("patient"),
  scheduleController.bookSlot,
);
router.put(
  "/slot/:slot_id",
  authenticate,
  authorize("doctor"),
  scheduleController.updateSlotStatus,
);

module.exports = router;
