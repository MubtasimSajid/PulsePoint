const express = require("express");
const router = express.Router();
const scheduleController = require("../controllers/scheduleController");

router.get("/doctor/:doctorId", scheduleController.getDoctorSchedules);
router.post("/", scheduleController.createDoctorSchedule);
router.get("/slots/:doctorId", scheduleController.getAvailableSlots);
router.post("/generate-slots", scheduleController.generateSlots);
router.post("/book-slot", scheduleController.bookSlot);
router.put("/slot/:slot_id", scheduleController.updateSlotStatus);

module.exports = router;
