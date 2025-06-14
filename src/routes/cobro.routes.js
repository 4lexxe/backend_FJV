const cobroCtrl = require("./../controllers/cobro.controller");
const express = require("express");
const router = express.Router();

router.get("/", cobroCtrl.getCobros);
router.get("/:id", cobroCtrl.getCobro);
router.post("/", cobroCtrl.createCobro);
router.put("/:id", cobroCtrl.updateCobro);
router.delete("/:id", cobroCtrl.deleteCobro);

module.exports = router;
