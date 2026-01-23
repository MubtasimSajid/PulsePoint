const express = require("express");
const router = express.Router();
const medicalHistoryController = require("../controllers/medicalHistoryController");

router.get("/", medicalHistoryController.getAllMedicalHistory);
router.get(
  "/patient/:patientId",
  medicalHistoryController.getMedicalHistoryByPatient,
);
router.post("/", medicalHistoryController.createMedicalHistory);
router.put("/:id", medicalHistoryController.updateMedicalHistory);
router.delete("/:id", medicalHistoryController.deleteMedicalHistory);

module.exports = router;
