/**
 * Controlador para manejar la autenticación con Google OAuth2
 */

const { generateToken } = require('../../utils/token');
const { success, error } = require('../../utils/responses');

/**
 * Maneja el callback después de la autenticación exitosa con Google
 */
const handleGoogleCallback = (req, res) => {
    try {
        // El usuario ya está autenticado por passport
        const user = req.user;
        
        if (!user) {
            return error(res, "No se pudo obtener información del usuario", null, 401);
        }
        
        // Generar token JWT
        const token = generateToken(user);
        
        // Preparar datos de usuario sin información sensible
        const userResponse = {
            id: user.id,
            nombre: user.nombre,
            apellido: user.apellido,
            email: user.email,
            rolId: user.rolId,
            fotoPerfil: user.fotoPerfil,
            emailVerificado: user.emailVerificado
        };
        
        // Responder con datos de usuario y token
        return success(res, "Autenticación con Google exitosa", {
            usuario: userResponse,
            token
        });
    } catch (err) {
        console.error("Error en handleGoogleCallback:", err);
        return error(res, "Error al procesar autenticación con Google", err, 500);
    }
};

module.exports = {
    handleGoogleCallback
};
