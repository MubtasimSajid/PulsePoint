const express = require("express");
const router = express.Router();
const appointmentController = require("../controllers/appointmentController");
const { authenticate, authorize } = require("../middleware/auth");

router.get("/", appointmentController.getAllAppointments);
router.get("/doctor/:doctorId", appointmentController.getAppointmentsByDoctor);
router.get(
  "/patient/:patientId",
  appointmentController.getAppointmentsByPatient,
);
router.get("/:id", appointmentController.getAppointmentById);
router.post("/", appointmentController.createAppointment);
router.put(
  "/:id/cancel",
  authenticate,
  authorize("doctor"),
  appointmentController.cancelAppointment,
);
router.put("/:id", appointmentController.updateAppointment);
router.delete("/:id", appointmentController.deleteAppointment);

module.exports = router;
