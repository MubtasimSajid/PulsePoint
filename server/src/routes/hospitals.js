const express = require("express");
const router = express.Router();
const hospitalController = require("../controllers/hospitalController");
const { authenticate } = require("../middleware/auth");

router.get("/", hospitalController.getAllHospitals);
router.get("/my/stats", authenticate, hospitalController.getMyHospitalStats);
router.get("/:id", hospitalController.getHospitalById);
router.get("/:id/doctors", hospitalController.getHospitalDoctors);
router.post("/", hospitalController.createHospital);
router.put("/:id", hospitalController.updateHospital);
router.delete("/:id", hospitalController.deleteHospital);

module.exports = router;
