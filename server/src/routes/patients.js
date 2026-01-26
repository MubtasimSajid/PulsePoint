const express = require("express");
const router = express.Router();
const patientController = require("../controllers/patientController");
const { authenticate } = require("../middleware/auth");

router.get("/", patientController.getAllPatients);
router.get("/:id", patientController.getPatientById);
router.post("/", patientController.createPatient);
router.put("/:id", authenticate, patientController.updatePatient);
router.delete("/:id", authenticate, patientController.deletePatient);

module.exports = router;
