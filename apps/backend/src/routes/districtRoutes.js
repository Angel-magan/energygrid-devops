const express = require("express");
const router = express.Router();
const districtController = require("../controllers/districtController");

router.get("/districts", districtController.getDistricts);
router.put("/districts/:districtId", districtController.updateDistrict);

module.exports = router;
