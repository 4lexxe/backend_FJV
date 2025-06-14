// src/routes/persona.routes.js
const personaCtrl = require("../controllers/persona.controller");
const express = require("express");
const router = express.Router();

// Ruta para obtener personas con filtros
router.get("/filter", personaCtrl.getPersonaFiltro);

// Ruta para obtener todas las personas
router.get("/", personaCtrl.getPersonas);

// Ruta para crear una nueva persona
router.post("/", personaCtrl.createPersona);

// Rutas para operaciones por ID (idPersona)
router.get("/:id", personaCtrl.getPersona);     // El ID en el parámetro de ruta se mapea a idPersona
router.put("/:id", personaCtrl.editPersona);    // El ID en el parámetro de ruta se mapea a idPersona
router.delete("/:id", personaCtrl.deletePersona); // El ID en el parámetro de ruta se mapea a idPersona

module.exports = router;