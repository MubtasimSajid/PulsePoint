const express = require("express");
const router = express.Router();

const userRoutes = require("./users");
const doctorRoutes = require("./doctors");
const patientRoutes = require("./patients");
const departmentRoutes = require("./departments");
const specializationRoutes = require("./specializations");
const hospitalRoutes = require("./hospitals");
const chamberRoutes = require("./chambers");
const appointmentRoutes = require("./appointments");
const prescriptionRoutes = require("./prescriptions");
const medicalHistoryRoutes = require("./medicalHistory");

router.use("/users", userRoutes);
router.use("/doctors", doctorRoutes);
router.use("/patients", patientRoutes);
router.use("/departments", departmentRoutes);
router.use("/specializations", specializationRoutes);
router.use("/hospitals", hospitalRoutes);
router.use("/chambers", chamberRoutes);
router.use("/appointments", appointmentRoutes);
router.use("/prescriptions", prescriptionRoutes);
router.use("/medical-history", medicalHistoryRoutes);

module.exports = router;
