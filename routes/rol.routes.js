const rolCtrl = require("../controllers/rol.controller");
const express = require("express");
const router = express.Router();

// Definimos las rutas para la gestión de roles
router.get("/filter", rolCtrl.getRolFiltro); // Ruta para filtro (antes de :id)
router.get("/", rolCtrl.getRoles);           // Obtener todos los roles
router.post("/", rolCtrl.createRol);         // Crear un nuevo rol
router.get("/:id", rolCtrl.getRol);         // Obtener un rol por ID
router.put("/:id", rolCtrl.editRol);        // Actualizar un rol por ID
router.delete("/:id", rolCtrl.deleteRol);   // Eliminar un rol por ID

// Exportamos el módulo de rutas
module.exports = router;