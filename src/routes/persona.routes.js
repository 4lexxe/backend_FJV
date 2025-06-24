// src/routes/persona.routes.js
const personaCtrl = require("../controllers/persona.controller");
const express = require("express");
const router = express.Router();
const { handleUploadErrors, processUploadedImage } = require('../middleware/upload.middleware');

// Ruta para obtener personas con filtros
router.get("/filter", personaCtrl.getPersonaFiltro);

// Ruta para obtener todas las personas
router.get("/", personaCtrl.getPersonas);

// Rutas específicas para fotos de perfil
router.get("/:id/foto", personaCtrl.getFotoPerfil);
router.delete("/:id/foto", personaCtrl.deleteFotoPerfil);

// Ruta para crear una nueva persona (con posible foto)
router.post("/", handleUploadErrors, processUploadedImage, personaCtrl.createPersona);

// Rutas para operaciones por ID (idPersona)
router.get("/:id", personaCtrl.getPersona);
router.put("/:id", handleUploadErrors, processUploadedImage, personaCtrl.editPersona);
router.delete("/:id", personaCtrl.deletePersona);

module.exports = router;