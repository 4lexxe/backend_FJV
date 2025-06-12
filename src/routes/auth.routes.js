const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/auth.controller');

// Ruta para registrar usuario
router.post('/register', authCtrl.register);

// Ruta para login
router.post('/login', authCtrl.login);

module.exports = router;
