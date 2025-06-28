// src/routes/persona.routes.js
const express = require("express");
const multer = require("multer");
const personaCtrl = require("../controllers/persona.controller");
const {
  handleUploadErrors,
  processUploadedImage,
} = require("../middleware/upload.middleware");

const router = express.Router();

// Nuevas rutas para Estadisticas
router.get("/resumen", personaCtrl.getResumen);
router.get("/tipo", personaCtrl.getCantidadPorCategoria);
router.get("/clubes", personaCtrl.getCantidadPorClub);

// Rutas CRUD para personas
router.get("/", personaCtrl.getPersonas);
router.post(
  "/",
  handleUploadErrors,
  processUploadedImage,
  personaCtrl.createPersona
);
router.get("/:id", personaCtrl.getPersona);
router.put(
  "/:id",
  handleUploadErrors,
  processUploadedImage,
  personaCtrl.editPersona
);
router.delete("/:id", personaCtrl.deletePersona);
router.get("/filtro/buscar", personaCtrl.getPersonaFiltro);

// Rutas para manejo de foto de perfil
router.get("/:id/foto", personaCtrl.getFotoPerfil);
router.delete("/:id/foto", personaCtrl.deleteFotoPerfil);

// Nuevas rutas para licencias y credenciales
router.put("/:id/renovar", personaCtrl.renovarLicencia);
router.post(
  "/actualizar-estado-licencias",
  personaCtrl.actualizarEstadoLicencias
);
router.get("/licencias/actualizar", personaCtrl.actualizarEstadoLicencias);

module.exports = router;
