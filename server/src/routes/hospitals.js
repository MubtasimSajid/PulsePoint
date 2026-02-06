const express = require("express");
const router = express.Router();
const hospitalController = require("../controllers/hospitalController");
const { authenticate } = require("../middleware/auth");

router.get("/", hospitalController.getAllHospitals);
router.get("/my/stats", authenticate, hospitalController.getMyHospitalStats);
router.get(
  "/my/recent-activity",
  authenticate,
  hospitalController.getMyRecentActivity,
);
router.get("/my/doctors", authenticate, hospitalController.getMyDoctors);
router.post("/my/doctors", authenticate, hospitalController.addDoctorToHospital);
router.put("/my/doctors/:doctorId", authenticate, hospitalController.updateDoctorFee);
router.delete("/my/doctors/:doctorId", authenticate, hospitalController.removeDoctorFromHospital);
router.get("/:id", hospitalController.getHospitalById);
router.get("/:id/doctors", hospitalController.getHospitalDoctors);
router.post("/", hospitalController.createHospital);
router.put("/:id", hospitalController.updateHospital);
router.delete("/:id", hospitalController.deleteHospital);

module.exports = router;
