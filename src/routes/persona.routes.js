// src/routes/persona.routes.js
const personaCtrl = require("../controllers/persona.controller");
const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Middleware para proteger todas las rutas - solo admin
router.use(authenticate, authorize('admin'));

// Ruta para obtener personas con filtros
router.get("/filter", personaCtrl.getPersonaFiltro);

// Ruta para obtener todas las personas
router.get("/", personaCtrl.getPersonas);

// Ruta para crear una nueva persona
router.post("/", personaCtrl.createPersona);

// Rutas para operaciones por ID (idPersona)
router.get("/:id", personaCtrl.getPersona);
router.put("/:id", personaCtrl.editPersona);
router.delete("/:id", personaCtrl.deletePersona);

// Ruta para importación masiva - solo para administradores
router.post("/importar", personaCtrl.importarPersonas);

module.exports = router;