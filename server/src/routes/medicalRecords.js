const express = require("express");
const router = express.Router();
const controller = require("../controllers/medicalRecordController");
const auth = require("../middleware/auth");

router.post("/", auth.authenticate, controller.createRecord);
router.get("/", auth.authenticate, controller.getPatientRecords);
router.delete("/:id", auth.authenticate, controller.deleteRecord);

module.exports = router;
