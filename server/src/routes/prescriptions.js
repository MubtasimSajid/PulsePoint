const express = require("express");
const router = express.Router();
const prescriptionController = require("../controllers/prescriptionController");

const auth = require("../middleware/auth"); // Assuming auth middleware exists and is needed

// router.get("/", prescriptionController.getAllPrescriptions);
// router.get("/:id", prescriptionController.getPrescriptionById);
// router.get("/appointment/:appointment_id", prescriptionController.getPrescriptionByAppointment);
router.get("/appointment/:appointment_id", prescriptionController.getPrescriptionByAppointment);
router.get("/patient/:patientId", prescriptionController.getPrescriptionsByPatient);
router.post("/", auth.authenticate, prescriptionController.createPrescription);
// router.put("/:id", prescriptionController.updatePrescription);
// router.delete("/:id", prescriptionController.deletePrescription);

module.exports = router;
