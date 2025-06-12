const usuarioCtrl = require("../controllers/usuario.controller");
const express = require("express");
const router = express.Router();

// Definimos las rutas para la gestión de usuario
router.post("/login", usuarioCtrl.loginUsuario); // Ruta para el login (generalmente POST)

router.get("/filter", usuarioCtrl.getUsuarioFiltro); // Ruta para filtro (antes de :id)
router.get("/", usuarioCtrl.getUsuarios);           // Obtener todos los usuarios
router.post("/", usuarioCtrl.createUsuario);         // Crear un nuevo usuario
router.get("/:id", usuarioCtrl.getUsuario);         // Obtener un usuario por ID
router.put("/:id", usuarioCtrl.editUsuario);        // Actualizar un usuario por ID
router.delete("/:id", usuarioCtrl.deleteUsuario);   // Eliminar un usuario por ID


// Exportamos el módulo de rutas
module.exports = router;