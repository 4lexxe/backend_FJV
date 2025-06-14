const express = require("express");
const router = express.Router();
const clubCtrl = require("../controllers/club.controller");
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Rutas públicas - cualquiera puede ver los clubes
router.get("/filter", clubCtrl.getClubFiltro);
router.get("/", clubCtrl.getClubs);
router.get("/:id", clubCtrl.getClub);

// Rutas protegidas - solo administradores
router.post("/", authenticate, authorize('admin'), clubCtrl.createClub);
router.put("/:id", authenticate, authorize('admin'), clubCtrl.editClub);
router.delete("/:id", authenticate, authorize('admin'), clubCtrl.deleteClub);

module.exports = router;