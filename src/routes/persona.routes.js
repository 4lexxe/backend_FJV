// src/routes/persona.routes.js
const express = require("express");
const multer = require("multer");
const personaCtrl = require("../controllers/persona.controller");
const {
  handleUploadErrors,
  processUploadedImage,
} = require("../middleware/upload.middleware");

const router = express.Router();

// --- Rutas de Estadísticas ---
// Deben ir primero para no colisionar con /:id
router.get("/resumen", personaCtrl.getResumen);
router.get("/tipo", personaCtrl.getCantidadPorCategoria);
router.get("/clubes", personaCtrl.getCantidadPorClub);
router.get("/filtro/buscar", personaCtrl.getPersonaFiltro);

// --- Rutas de Actualización Masiva ---
router.post(
  "/actualizar-estado-licencias",
  personaCtrl.actualizarEstadoLicencias
);

// Rutas CRUD para personas
router.get("/", personaCtrl.getPersonas);
router.get("/:id", personaCtrl.getPersona);
router.post(
  "/",
  handleUploadErrors,
  processUploadedImage,
  personaCtrl.createPersona
);
router.put(
  "/:id",
  handleUploadErrors,
  processUploadedImage,
  personaCtrl.editPersona
);
router.delete("/:id", personaCtrl.deletePersona);

// Rutas para manejo de foto de perfil
router.get("/:id/foto", personaCtrl.getPersonaFoto);
router.delete("/:id/foto", personaCtrl.deleteFotoPerfil);

// Ruta para licencia individual
router.put("/:id/renovar", personaCtrl.renovarLicencia);

module.exports = router;
