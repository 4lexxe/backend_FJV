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

// Register - Registrar nuevo usuario
authCtrl.register = async (req, res) => {
    /*
    #swagger.tags = ['Autenticación']
    #swagger.summary = 'Registrar nuevo usuario'
    #swagger.description = 'Registra un nuevo usuario en el sistema y retorna un token JWT.'
    #swagger.parameters['body'] = {
      in: 'body',
      description: 'Datos del usuario a registrar.',
      required: true,
      schema: {
        type: 'object',
        properties: {
          nombre: { type: 'string' },
          apellido: { type: 'string' },
          email: { type: 'string' },
          password: { type: 'string' },
          rolId: { type: 'integer' }
        },
        required: ['nombre', 'apellido', 'email', 'password']
      }
    }
    */
    try {
        const { nombre, apellido, email, password, rolId } = req.body;

        // Validaciones básicas
        if (!nombre || !apellido || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Todos los campos son obligatorios"
            });
        }

        // Verificar si el usuario ya existe
        const usuarioExistente = await Usuario.findOne({ where: { email } });
        if (usuarioExistente) {
            return res.status(400).json({
                success: false,
                message: "El email ya está registrado"
            });
        }

        // Asignar rol por defecto si no se proporciona
        const rolUsuario = rolId || 1; // Rol por defecto

        // Crear nuevo usuario (la contraseña se hashea automáticamente en el hook del modelo)
        const nuevoUsuario = await Usuario.create({
            nombre,
            apellido,
            email,
            password,
            rolId: rolUsuario
        });

        // Generar token JWT
        const token = generateToken(nuevoUsuario);

        // Preparar respuesta sin contraseña
        const usuarioResponse = {
            id: nuevoUsuario.id,
            nombre: nuevoUsuario.nombre,
            apellido: nuevoUsuario.apellido,
            email: nuevoUsuario.email,
            rolId: nuevoUsuario.rolId
        };

        res.status(201).json({
            success: true,
            message: "Usuario registrado correctamente",
            usuario: usuarioResponse,
            token: token
        });

    } catch (error) {
        console.error("Error en register:", error);
        
        // Manejo de errores específicos de Sequelize
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                message: "Error de validación",
                errors: error.errors.map(err => err.message)
            });
        }

        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({
                success: false,
                message: "El email ya está registrado"
            });
        }

        res.status(500).json({
            success: false,
            message: "Error interno del servidor",
            error: error.message
        });
    }
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
