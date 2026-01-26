const express = require("express");
const router = express.Router();
const doctorController = require("../controllers/doctorController");
const { authenticate } = require("../middleware/auth");

router.get("/", doctorController.getAllDoctors);
router.get("/:id", doctorController.getDoctorById);
router.post("/", doctorController.createDoctor);
router.put("/:id", authenticate, doctorController.updateDoctor);
router.delete("/:id", authenticate, doctorController.deleteDoctor);

module.exports = router;
