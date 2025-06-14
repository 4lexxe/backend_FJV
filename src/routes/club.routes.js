const express = require("express");
const router = express.Router();
const clubCtrl = require("../controllers/club.controller");

router.get("/filter", clubCtrl.getClubFiltro);
router.get("/", clubCtrl.getClubs);
router.post("/", clubCtrl.createClub);
router.get("/:id", clubCtrl.getClub);
router.put("/:id", clubCtrl.editClub);
router.delete("/:id", clubCtrl.deleteClub);

module.exports = router;