const Usuario = require("../models/Usuario");
const Rol = require("../models/Rol"); // Para incluir el rol en las respuestas
const { Op } = require('sequelize'); // Para los operadores de Sequelize

const usuarioCtrl = {};

usuarioCtrl.getUsuarios = async (req, res) => {
    /*
    #swagger.tags = ['Usuarios']
    #swagger.summary = 'Obtener todos los Usuarios'
    #swagger.description = 'Retorna una lista de todos los Usuarios, con su Rol asociado.'
    */
    try {
        const usuarios = await Usuario.findAll({
            include: [{
                model: Rol,
                as: 'rol',
                attributes: ['id', 'nombre', 'descripcion'] // Incluir solo los campos necesarios del rol
            }],
            attributes: { exclude: ['password'] } // Excluir el campo password para seguridad
        });
        res.status(200).json(usuarios);
    } catch (error) {
        console.error("Error en getUsuarios:", error);
        res.status(500).json({
            status: "0",
            msg: "Error procesando la operación.",
            error: error.message
        });
    }
};

usuarioCtrl.createUsuario = async (req, res) => {
    /*
    #swagger.tags = ['Usuarios']
    #swagger.summary = 'Crear un nuevo Usuario'
    #swagger.description = 'Agrega un nuevo usuario a la base de datos. La contraseña se hashea automáticamente.'
    #swagger.parameters['body'] = {
      in: 'body',
      description: 'Datos del usuario a crear. El campo "rolId" debe ser el ID de un rol existente.',
      required: true,
      schema: { $ref: '#/definitions/Usuario' } // Asumiendo que has definido 'Usuario' en tus definiciones de Swagger
    }
    */
    try {
        // Verificar si el email ya existe antes de crear el usuario
        const emailExistente = await Usuario.findOne({ where: { email: req.body.email } });
        if (emailExistente) {
            return res.status(400).json({
                status: "0",
                msg: "El email ya está registrado en el sistema",
                error: "EMAIL_ALREADY_EXISTS"
            });
        }

        const usuario = await Usuario.create(req.body);
        // Al devolver, se excluye la contraseña para seguridad
        const usuarioResponse = { ...usuario.toJSON() };
        delete usuarioResponse.password;

        res.status(201).json({
            status: "1",
            msg: "Usuario guardado.",
            usuario: usuarioResponse
        });
    } catch (error) {
        console.error("Error al crear usuario:", error);
        
        // Manejo específico para errores de validación de Sequelize
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({
                status: "0",
                msg: "El email ya está registrado en el sistema",
                error: "EMAIL_ALREADY_EXISTS"
            });
        }
        
        // Manejo de otros errores de validación
        if (error.name === 'SequelizeValidationError') {
            const validationErrors = error.errors.map(err => ({
                field: err.path,
                message: err.message
            }));
            
            return res.status(400).json({
                status: "0",
                msg: "Error de validación",
                errors: validationErrors
            });
        }
        
        res.status(500).json({
            status: "0",
            msg: "Error procesando la operación.",
            error: error.message
        });
    }
};

usuarioCtrl.getUsuario = async (req, res) => {
    /*
    #swagger.tags = ['Usuarios']
    #swagger.summary = 'Obtener Usuario por ID'
    #swagger.description = 'Retorna un usuario específico usando su ID, con su Rol asociado.'
    */
    try {
        const usuario = await Usuario.findByPk(req.params.id, {
            include: [{
                model: Rol,
                as: 'rol',
                attributes: ['id', 'nombre', 'descripcion']
            }],
            attributes: { exclude: ['password'] } // Excluir la contraseña
        });

        if (!usuario) {
            return res.status(404).json({
                status: "0",
                msg: "Usuario no encontrado."
            });
        }
        res.status(200).json(usuario);
    } catch (error) {
        console.error("Error en getUsuario:", error);
        res.status(500).json({
            status: "0",
            msg: "Error procesando la operación.",
            error: error.message
        });
    }
};

usuarioCtrl.editUsuario = async (req, res) => {
    /*
    #swagger.tags = ['Usuarios']
    #swagger.summary = 'Actualizar un Usuario'
    #swagger.description = 'Actualiza la información de un usuario existente usando su ID. La contraseña se hashea si se modifica.'
    #swagger.parameters['body'] = {
      in: 'body',
      description: 'Datos del usuario a actualizar.',
      required: true,
      schema: { $ref: '#/definitions/Usuario' }
    }
    */
    try {
        const [updatedRowsCount, updatedUsuarios] = await Usuario.update(req.body, {
            where: { id: req.params.id },
            returning: true // Para PostgreSQL, retorna los registros actualizados
        });

        if (updatedRowsCount === 0) {
            return res.status(404).json({
                status: "0",
                msg: "Usuario no encontrado para actualizar."
            });
        }

        // Excluir la contraseña del objeto retornado
        const usuarioResponse = { ...updatedUsuarios[0].toJSON() };
        delete usuarioResponse.password;

        res.status(200).json({
            status: "1",
            msg: "Usuario actualizado.",
            usuario: usuarioResponse
        });
    } catch (error) {
        console.error("Error en editUsuario:", error);
        res.status(400).json({
            status: "0",
            msg: "Error procesando la operación.",
            error: error.message
        });
    }
};

usuarioCtrl.deleteUsuario = async (req, res) => {
    /*
    #swagger.tags = ['Usuarios']
    #swagger.summary = 'Eliminar un Usuario'
    #swagger.description = 'Elimina un usuario de la base de datos usando su ID.'
    */
    try {
        const deletedRows = await Usuario.destroy({
            where: { id: req.params.id }
        });

        if (deletedRows === 0) {
            return res.status(404).json({
                status: "0",
                msg: "Usuario no encontrado para eliminar."
            });
        }

        res.status(200).json({
            status: "1",
            msg: "Usuario eliminado."
        });
    } catch (error) {
        console.error("Error en deleteUsuario:", error);
        res.status(400).json({
            status: "0",
            msg: "Error procesando la operación.",
            error: error.message
        });
    }
};

usuarioCtrl.getUsuarioFiltro = async (req, res) => {
    /*
    #swagger.tags = ['Usuarios']
    #swagger.summary = 'Filtrar Usuarios'
    #swagger.description = 'Retorna usuarios que coinciden con los criterios de filtro (nombre, email, rolId).'
    #swagger.parameters['nombre'] = { in: 'query', description: 'Filtra por nombre del usuario.', type: 'string' }
    #swagger.parameters['email'] = { in: 'query', description: 'Filtra por email del usuario.', type: 'string' }
    #swagger.parameters['rolId'] = { in: 'query', description: 'Filtra por el ID del rol asociado al usuario.', type: 'integer' }
    */
    const query = req.query;
    const criteria = {};

    if (query.nombre) {
        criteria.nombre = { [Op.iLike]: `%${query.nombre}%` };
    }
    if (query.email) {
        criteria.email = { [Op.iLike]: `%${query.email}%` };
    }
    if (query.rolId) {
        criteria.rolId = query.rolId;
    }

    try {
        const usuarios = await Usuario.findAll({
            where: criteria,
            include: [{
                model: Rol,
                as: 'rol',
                attributes: ['id', 'nombre', 'descripcion']
            }],
            attributes: { exclude: ['password'] } // Excluir la contraseña
        });
        res.status(200).json(usuarios);
    } catch (error) {
        console.error("Error en getUsuarioFiltro:", error);
        res.status(500).json({
            status: "0",
            msg: "Error procesando la operación.",
            error: error.message
        });
    }
};

// **Opcional: Controlador para el Login (Autenticación)**
usuarioCtrl.loginUsuario = async (req, res) => {
    /*
    #swagger.tags = ['Usuarios']
    #swagger.summary = 'Autenticar Usuario'
    #swagger.description = 'Permite a un usuario iniciar sesión y retorna información del usuario si las credenciales son válidas.'
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
    #swagger.responses[200] = {
      description: 'Autenticación exitosa.',
      schema: {
        status: '1',
        msg: 'Autenticación exitosa.',
        user: { $ref: '#/definitions/Usuario' }
      }
    }
    #swagger.responses[401] = {
      description: 'Credenciales inválidas.',
      schema: {
        status: '0',
        msg: 'Credenciales inválidas.'
      }
    }
    */
    const { email, password } = req.body;
    try {
        const usuario = await Usuario.findOne({
            where: { email: email },
            include: [{
                model: Rol,
                as: 'rol',
                attributes: ['id', 'nombre', 'descripcion']
            }]
        });

        if (!usuario) {
            return res.status(401).json({ status: "0", msg: "Credenciales inválidas." });
        }

        const isMatch = await usuario.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ status: "0", msg: "Credenciales inválidas." });
        }

        // Excluir la contraseña del objeto de respuesta
        const userResponse = { ...usuario.toJSON() };
        delete userResponse.password;

        res.status(200).json({ status: "1", msg: "Autenticación exitosa.", user: userResponse });
    } catch (error) {
        console.error("Error en loginUsuario:", error);
        res.status(500).json({ status: "0", msg: "Error de servidor.", error: error.message });
    }
};

module.exports = usuarioCtrl;