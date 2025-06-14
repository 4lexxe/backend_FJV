const Usuario = require('../models/Usuario');
const Rol = require('../models/Rol');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const authCtrl = {};

// Función para generar JWT token
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

// Login - Autenticar usuario
authCtrl.login = async (req, res) => {
    /*
    #swagger.tags = ['Autenticación']
    #swagger.summary = 'Iniciar sesión'
    #swagger.description = 'Autentica un usuario y retorna un token JWT.'
    #swagger.parameters['body'] = {
      in: 'body',
      description: 'Credenciales del usuario.',
      required: true,
      schema: {
        type: 'object',
        properties: {
          email: { type: 'string' },
          password: { type: 'string' }
        },
        required: ['email', 'password']
      }
    }
    */
    try {
        const { email, password } = req.body;

        // Validaciones básicas
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email y contraseña son obligatorios"
            });
        }

        // Buscar usuario por email
        const usuario = await Usuario.findOne({
            where: { email },
            include: [{
                model: Rol,
                as: 'rol',
                attributes: ['id', 'nombre', 'descripcion']
            }]
        });

        if (!usuario) {
            return res.status(401).json({
                success: false,
                message: "Credenciales inválidas"
            });
        }

        // Verificar contraseña
        const isMatch = await usuario.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Credenciales inválidas"
            });
        }

        // Generar token JWT
        const token = generateToken(usuario);

        // Preparar respuesta sin contraseña
        const usuarioResponse = {
            id: usuario.id,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            email: usuario.email,
            rolId: usuario.rolId,
            rol: usuario.rol
        };

        res.status(200).json({
            success: true,
            message: "Inicio de sesión exitoso",
            usuario: usuarioResponse,
            token: token
        });

    } catch (error) {
        console.error("Error en login:", error);
        res.status(500).json({
            success: false,
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

module.exports = authCtrl;
