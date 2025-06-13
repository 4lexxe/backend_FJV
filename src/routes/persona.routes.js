const personaCtrl = require("../controllers/persona.controller");
const express = require("express");
const router = express.Router();

router.get("/filter", personaCtrl.getPersonaFiltro);
router.get("/", personaCtrl.getPersonas);
router.post("/", personaCtrl.createPersona);
router.get("/:id", personaCtrl.getPersona);
router.put("/:id", personaCtrl.editPersona);
router.delete("/:id", personaCtrl.deletePersona);

module.exports = router;