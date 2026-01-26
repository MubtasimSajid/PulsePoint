const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const { authenticate } = require("../middleware/auth");

router.get("/balance", authenticate, paymentController.getBalance);
router.post("/add-funds", authenticate, paymentController.addFunds);

module.exports = router;
