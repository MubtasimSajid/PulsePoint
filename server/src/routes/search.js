const express = require("express");
const router = express.Router();
const searchController = require("../controllers/searchController");

router.get("/doctors", searchController.searchDoctors);
router.get("/locations", searchController.getLocations);
router.get("/facilities", searchController.getFacilitiesByLocation);

module.exports = router;
