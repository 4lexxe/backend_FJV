/**
 * Rutas para autenticación 
 */

const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const authCtrl = require('../controllers/auth.controller');
const googleAuthCtrl = require('../controllers/google-auth.controller');
const linkedinAuthCtrl = require('../controllers/linkedin-auth.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Función reutilizable para manejar callbacks de autenticación social
const handleSocialAuthCallback = (strategyName, errorRedirect) => {
    return (req, res, next) => {
        console.log(`Procesando callback de ${strategyName}...`);
        passport.authenticate(strategyName, { 
            session: true,
            failureRedirect: errorRedirect
        }, (err, user, info) => {
            if (err || !user) {
                const errorMsg = err?.message || 'Error de autenticación';
                console.error(`Error en autenticación ${strategyName}:`, errorMsg);
                
                // Simplificar el mensaje de error
                if (errorMsg.includes('no registrado') || errorMsg.includes('no encontrado') || errorMsg.includes('no existe')) {
                    return res.redirect(`${errorRedirect}?error=${encodeURIComponent('Usuario no encontrado')}`);
                }
                
                return res.redirect(`${errorRedirect}?error=${encodeURIComponent(errorMsg)}`);
            }
            
            req.logIn(user, (loginErr) => {
                if (loginErr) {
                    console.error(`Error al guardar sesión ${strategyName}:`, loginErr);
                    return res.redirect(`${errorRedirect}?error=${encodeURIComponent(loginErr.message)}`);
                }
                console.log(`Usuario autenticado exitosamente con ${strategyName}: ${user.email}`);
                next();
            });
        })(req, res, next);
    };
};

//------------------------------------------------------------
// RUTAS DE AUTENTICACIÓN TRADICIONAL
//------------------------------------------------------------

// Iniciar sesión con email y contraseña
router.post('/login', authCtrl.login);

// Validar token JWT
router.get('/validate-token', authenticate, authCtrl.validateToken);

// Ruta protegida de ejemplo - solo accesible por administradores
router.get('/admin-only', authenticate, authorize('admin'), (req, res) => {
    res.json({ 
        success: true,
        message: 'Tienes acceso como administrador',
        user: {
            id: req.user.id,
            nombre: req.user.nombre,
            rol: req.user.rol?.nombre
        }
    });
});

//------------------------------------------------------------
// RUTAS DE AUTENTICACIÓN CON GOOGLE
//------------------------------------------------------------

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Callback después de autenticación con Google
router.get('/google/callback', 
    handleSocialAuthCallback('google', '/api/auth/login-error'),
    googleAuthCtrl.handleGoogleCallback
);

//------------------------------------------------------------
// RUTAS DE AUTENTICACIÓN CON LINKEDIN
//------------------------------------------------------------

// Iniciar el flujo de autenticación con LinkedIn
router.get('/linkedin', (req, res, next) => {
    console.log('Iniciando autenticación con LinkedIn...');
    passport.authenticate('linkedin', {
        scope: ['openid', 'profile', 'email']
    })(req, res, next);
});

// Callback después de autenticación con LinkedIn - CORREGIDO
router.get('/linkedin/callback', (req, res, next) => {
    console.log('Recibido callback de LinkedIn con parámetros:', {
        code: req.query.code ? 'PRESENTE' : 'AUSENTE',
        state: req.query.state || 'NO PRESENTE',
        error: req.query.error || 'NINGUNO'
    });
    
    if (req.query.error) {
        console.error('Error en callback de LinkedIn:', req.query.error, req.query.error_description);
        return res.redirect(`/api/auth/login-error?error=${encodeURIComponent(req.query.error_description || req.query.error)}`);
    }
    
    handleSocialAuthCallback('linkedin', '/api/auth/login-error')(req, res, next);
}, linkedinAuthCtrl.handleLinkedInCallback);

//------------------------------------------------------------
// RUTAS PROTEGIDAS (REQUIEREN AUTENTICACIÓN)
//------------------------------------------------------------

router.get('/profile', authenticate, (req, res) => {
    const userResponse = { ...req.user.toJSON() };
    // Eliminar datos sensibles
    delete userResponse.password;
    delete userResponse.accessToken;
    delete userResponse.refreshToken;
    
    res.json({ user: userResponse });
});

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

router.get('/login-error', (req, res) => {
    const errorMessage = req.query.error || 'Error de autenticación';
    res.status(401).json({
        success: false,
        message: "Error de autenticación",
        details: errorMessage
    });
});

module.exports = router;
