/**
 * Rutas para autenticación 
 * Incluye login tradicional, Google OAuth y JWT
 */

const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const authCtrl = require('../controllers/auth.controller');
const googleAuthCtrl = require('../controllers/auth/google');
const { authenticate } = require('../middleware/auth.middleware');

//------------------------------------------------------------
// RUTAS DE AUTENTICACIÓN TRADICIONAL
//------------------------------------------------------------

// Iniciar sesión con email y contraseña
router.post('/login', authCtrl.login);

//------------------------------------------------------------
// RUTAS DE AUTENTICACIÓN CON GOOGLE
//------------------------------------------------------------

// Iniciar el flujo de autenticación con Google
router.get('/google', passport.authenticate('google', { 
    scope: ['profile', 'email'] 
}));

// Callback después de autenticación con Google
router.get('/google/callback', 
    // Middleware para autenticación con passport
    (req, res, next) => {
        passport.authenticate('google', { 
            session: true,
            failureRedirect: '/api/auth/login-error'
        }, (err, user, info) => {
            if (err || !user) {
                const errorMsg = err?.message || 'Error de autenticación';
                return res.redirect(`/api/auth/login-error?error=${encodeURIComponent(errorMsg)}`);
            }
            
            req.logIn(user, (err) => {
                if (err) {
                    console.error('Error al guardar sesión:', err);
                    return res.redirect(`/api/auth/login-error?error=${encodeURIComponent(err.message)}`);
                }
                next();
            });
        })(req, res, next);
    },
    // Controlador para generar token y responder
    googleAuthCtrl.handleGoogleCallback
);

//------------------------------------------------------------
// RUTAS PROTEGIDAS (REQUIEREN AUTENTICACIÓN)
//------------------------------------------------------------

// Obtener perfil del usuario autenticado
router.get('/profile', authenticate, (req, res) => {
    // Excluir datos sensibles
    const userResponse = { ...req.user.toJSON() };
    delete userResponse.password;
    delete userResponse.accessToken;
    delete userResponse.refreshToken;
    
    res.json({ user: userResponse });
});

// Verificar estado de autenticación
router.get('/status', (req, res) => {
    res.json({
        authenticated: req.isAuthenticated(),
        user: req.user ? {
            id: req.user.id,
            email: req.user.email,
            nombre: req.user.nombre,
            apellido: req.user.apellido,
            rol: req.user.rolId
        } : null
    });
});

//------------------------------------------------------------
// MANEJO DE ERRORES DE AUTENTICACIÓN
//------------------------------------------------------------

// Endpoint para manejar errores de autenticación
router.get('/login-error', (req, res) => {
    const errorMessage = req.query.error || 'Error de autenticación';
    res.status(401).json({
        success: false,
        message: "Error de autenticación",
        details: errorMessage
    });
});

module.exports = router;
