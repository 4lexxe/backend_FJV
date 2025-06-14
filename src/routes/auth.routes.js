const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/auth.controller');
const passport = require('../config/passport');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth.middleware');

// Ruta para login
router.post('/login', authCtrl.login);

// Ruta para iniciar el flujo de autenticación con LinkedIn
router.get('/linkedin', passport.authenticate('linkedin', {
    scope: ['r_liteprofile', 'r_emailaddress']
}));

// Callback URL para LinkedIn después de la autenticación
router.get('/linkedin/callback', 
    (req, res, next) => {
        passport.authenticate('linkedin', { 
            failureRedirect: '/api/auth/login-error',
        }, (err, user, info) => {
            if (err) {
                console.error('Error detallado de autenticación LinkedIn:', err);
                return res.redirect(`/api/auth/login-error?error=${encodeURIComponent(err.message || 'Error de autenticación')}`);
            }
            
            if (!user) {
                return res.redirect('/api/auth/login-error?error=Usuario no encontrado');
            }
            
            req.logIn(user, function(err) {
                if (err) {
                    console.error('Error en login:', err);
                    return res.redirect(`/api/auth/login-error?error=${encodeURIComponent(err.message || 'Error de login')}`);
                }
                
                next();
            });
        })(req, res, next);
    },
    (req, res) => {
        try {
            const user = req.user;
            
            // Generar JWT para el cliente
            const token = jwt.sign(
                { 
                    id: user.id, 
                    email: user.email,
                    rolId: user.rolId
                },
                process.env.JWT_SECRET || 'tu_clave_secreta_jwt',
                { expiresIn: '24h' }
            );
            
            console.log('Usuario autenticado exitosamente:', {
                id: user.id,
                email: user.email,
                nombre: user.nombre,
                apellido: user.apellido
            });

            // Para pruebas sin frontend, mostrar la información directamente en el navegador
            res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Autenticación Exitosa</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            line-height: 1.6;
                            max-width: 800px;
                            margin: 0 auto;
                            padding: 20px;
                        }
                        .success-container {
                            background-color: #f0fff0;
                            border: 1px solid #99e699;
                            border-radius: 5px;
                            padding: 20px;
                            margin-bottom: 20px;
                        }
                        .token-container {
                            background-color: #f5f5f5;
                            border: 1px solid #ddd;
                            border-radius: 5px;
                            padding: 15px;
                            word-break: break-all;
                            margin-bottom: 20px;
                        }
                        h1 {
                            color: #2e7d32;
                        }
                        pre {
                            background-color: #f8f8f8;
                            padding: 10px;
                            border-radius: 5px;
                            overflow-x: auto;
                        }
                        .btn {
                            display: inline-block;
                            background-color: #4CAF50;
                            color: white;
                            padding: 10px 15px;
                            text-decoration: none;
                            border-radius: 4px;
                            margin-top: 10px;
                        }
                    </style>
                </head>
                <body>
                    <div class="success-container">
                        <h1>¡Autenticación con LinkedIn exitosa!</h1>
                        <p>Has iniciado sesión correctamente con tu cuenta de LinkedIn.</p>
                    </div>

                    <h2>Información del usuario:</h2>
                    <pre>${JSON.stringify({
                        id: user.id,
                        nombre: user.nombre,
                        apellido: user.apellido,
                        email: user.email,
                        rolId: user.rolId
                    }, null, 2)}</pre>

                    <h2>Tu token JWT:</h2>
                    <div class="token-container">
                        ${token}
                    </div>

                    <p>Para usar este token en tus solicitudes API, inclúyelo en el encabezado de autorización:</p>
                    <pre>Authorization: Bearer ${token}</pre>

                    <p>
                        <a href="/api/auth/profile" class="btn">Ver tu perfil completo (necesita token)</a>
                    </p>
                </body>
                </html>
            `);
        } catch (error) {
            console.error("Error en el callback de LinkedIn:", error);
            res.redirect(`/api/auth/login-error?error=${encodeURIComponent(error.message)}`);
        }
    }
);

// Manejador de errores para la autenticación
router.use((err, req, res, next) => {
    console.error('Error en la autenticación:', err);
    res.redirect('/api/auth/login-error?error=' + encodeURIComponent(err.message));
});

// Rutas para manejar errores de login
router.get('/login-error', (req, res) => {
    const errorMessage = req.query.error || 'Error de autenticación';
    
    res.status(401).send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Error de Autenticación</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    text-align: center;
                    margin-top: 50px;
                    background-color: #f5f5f5;
                }
                .container {
                    max-width: 500px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: white;
                    border-radius: 5px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }
                .error {
                    color: red;
                    font-weight: bold;
                }
                .btn {
                    display: inline-block;
                    padding: 10px 15px;
                    background-color: #0077b5;
                    color: white;
                    text-decoration: none;
                    border-radius: 3px;
                }
                .error-details {
                    margin: 20px 0;
                    text-align: left;
                    padding: 10px;
                    background-color: #f9f9f9;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>Error de Autenticación</h2>
                <p class="error">Error de autenticación</p>
                <div class="error-details">
                    <strong>Detalles del error:</strong> ${errorMessage}
                </div>
                <p>Hubo un problema con la autenticación. Por favor intenta de nuevo o contacta al administrador.</p>
                <div>
                    <a href="/api/auth/linkedin" class="btn">Intentar nuevamente</a>
                </div>
            </div>
        </body>
        </html>
    `);
});

// Ruta para obtener el perfil del usuario autenticado
router.get('/profile', authMiddleware, (req, res) => {
    // Excluir datos sensibles como contraseña
    const userResponse = { ...req.user.toJSON() };
    delete userResponse.password;
    delete userResponse.accessToken;
    delete userResponse.refreshToken;
    
    res.json({ user: userResponse });
});

// Ruta de prueba para verificar el estado de autenticación
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

module.exports = router;
