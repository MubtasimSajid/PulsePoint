const express = require("express");
const router = express.Router();
const specializationController = require("../controllers/specializationController");

router.get("/", specializationController.getAllSpecializations);
router.get("/:id", specializationController.getSpecializationById);
router.post("/", specializationController.createSpecialization);
router.put("/:id", specializationController.updateSpecialization);
router.delete("/:id", specializationController.deleteSpecialization);

module.exports = router;
