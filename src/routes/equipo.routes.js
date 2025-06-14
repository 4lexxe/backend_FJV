const express = require("express");
const router = express.Router();
const equipoCtrl = require("../controllers/equipo.controller");
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Rutas públicas - cualquiera puede ver los equipos
router.get("/filter", equipoCtrl.getEquipoFiltro);
router.get("/", equipoCtrl.getEquipos);
router.get("/:id", equipoCtrl.getEquipo);

// Rutas protegidas - solo administradores
router.post("/", authenticate, authorize('admin'), equipoCtrl.createEquipo);
router.put("/:id", authenticate, authorize('admin'), equipoCtrl.editEquipo);
router.delete("/:id", authenticate, authorize('admin'), equipoCtrl.deleteEquipo);

module.exports = router;