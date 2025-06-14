/**
 * Controlador para la autenticación con LinkedIn OAuth2
 */

const jwt = require('jsonwebtoken');

const linkedinAuthController = {};

/**
 * Middleware para manejar el resultado de la autenticación con LinkedIn
 */
linkedinAuthController.handleLinkedInCallback = (req, res) => {
    try {
        console.log('Ejecutando controlador final de LinkedIn callback');
        const user = req.user;
        
        if (!user) {
            console.error('No hay usuario autenticado en la solicitud');
            return res.status(401).json({
                success: false,
                message: "Usuario no encontrado"
            });
        }
        
        // Generar token JWT y preparar respuesta
        const token = generateToken(user);
        const userResponse = prepareUserResponse(user);
        
        // MODIFICADO: No redirigir al frontend, siempre devolver JSON
        console.log('Autenticación exitosa con LinkedIn para:', user.email);
        return res.status(200).json({
            success: true,
            message: "Autenticación con LinkedIn exitosa",
            usuario: userResponse,
            token: token
        });
    } catch (error) {
        console.error("Error en callback de LinkedIn:", error);
        return res.status(500).json({
            success: false,
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

/**
 * Genera un token JWT para el usuario autenticado
 */
function generateToken(user) {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            rolId: user.rolId
        },
        process.env.JWT_SECRET || 'tu_clave_secreta_jwt',
        { expiresIn: '24h' }
    );
}

/**
 * Prepara los datos del usuario para la respuesta, excluyendo datos sensibles
 */
function prepareUserResponse(user) {
    return {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        rolId: user.rolId,
        fotoPerfil: user.fotoPerfil,
        emailVerificado: user.emailVerificado,
        providerType: user.providerType
    };
}

module.exports = linkedinAuthController;
