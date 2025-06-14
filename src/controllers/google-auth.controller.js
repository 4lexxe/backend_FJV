/**
 * Controlador para la autenticación con Google OAuth2
 * Maneja callbacks y generación de tokens después de la autenticación
 */

const jwt = require('jsonwebtoken');

const googleAuthController = {};

/**
 * Genera un token JWT para el usuario autenticado
 * @param {Object} user - Usuario autenticado
 * @returns {String} Token JWT
 */
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            rolId: user.rolId
        },
        process.env.JWT_SECRET || 'tu_clave_secreta_jwt',
        { expiresIn: '24h' }
    );
};

/**
 * Middleware para manejar el resultado de la autenticación con Google
 * Genera un token JWT y responde con información del usuario
 */
googleAuthController.handleGoogleCallback = (req, res) => {
    try {
        // El usuario ya está autenticado y disponible en req.user gracias a Passport
        const user = req.user;
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Autenticación fallida"
            });
        }
        
        // Generar token JWT
        const token = generateToken(user);
        
        // Preparar respuesta sin datos sensibles
        const userResponse = {
            id: user.id,
            nombre: user.nombre,
            apellido: user.apellido,
            email: user.email,
            rolId: user.rolId,
            fotoPerfil: user.fotoPerfil,
            emailVerificado: user.emailVerificado,
            providerType: user.providerType
        };
        
        // Responder con datos de usuario y token
        return res.status(200).json({
            success: true,
            message: "Autenticación con Google exitosa",
            usuario: userResponse,
            token: token
        });
    } catch (error) {
        console.error("Error en callback de Google:", error);
        return res.status(500).json({
            success: false,
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

module.exports = googleAuthController;
