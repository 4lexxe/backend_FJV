const Rol = require("../models/Rol");
const { Op } = require('sequelize'); // Para los operadores de Sequelize

const rolCtrl = {};

rolCtrl.getRoles = async (req, res) => {
    /*
    #swagger.tags = ['Roles']
    #swagger.summary = 'Obtener todos los Roles'
    #swagger.description = 'Retorna una lista de todos los Roles.'
    */
    try {
        const roles = await Rol.findAll();
        res.status(200).json(roles);
    } catch (error) {
        console.error("Error en getRoles:", error);
        res.status(500).json({
            status: "0",
            msg: "Error procesando la operación.",
            error: error.message
        });
    }
};

rolCtrl.createRol = async (req, res) => {
    /*
    #swagger.tags = ['Roles']
    #swagger.summary = 'Crear un nuevo Rol'
    #swagger.description = 'Agrega un nuevo rol a la base de datos.'
    #swagger.parameters['body'] = {
      in: 'body',
      description: 'Datos del rol a crear.',
      required: true,
      schema: { $ref: '#/definitions/Rol' } // Asumiendo que has definido 'Rol' en tus definiciones de Swagger
    }
    */
    try {
        const rol = await Rol.create(req.body);
        res.status(201).json({
            status: "1",
            msg: "Rol guardado.",
            rol: rol
        });
    } catch (error) {
        console.error("Error en createRol:", error);
        res.status(400).json({
            status: "0",
            msg: "Error procesando operación.",
            error: error.message
        });
    }
};

rolCtrl.getRol = async (req, res) => {
    /*
    #swagger.tags = ['Roles']
    #swagger.summary = 'Obtener Rol por ID'
    #swagger.description = 'Retorna un rol específico usando su ID.'
    */
    try {
        const rol = await Rol.findByPk(req.params.id);

        if (!rol) {
            return res.status(404).json({
                status: "0",
                msg: "Rol no encontrado."
            });
        }
        res.status(200).json(rol);
    } catch (error) {
        console.error("Error en getRol:", error);
        res.status(500).json({
            status: "0",
            msg: "Error procesando la operación.",
            error: error.message
        });
    }
};

rolCtrl.editRol = async (req, res) => {
    /*
    #swagger.tags = ['Roles']
    #swagger.summary = 'Actualizar un Rol'
    #swagger.description = 'Actualiza la información de un rol existente usando su ID.'
    #swagger.parameters['body'] = {
      in: 'body',
      description: 'Datos del rol a actualizar.',
      required: true,
      schema: { $ref: '#/definitions/Rol' }
    }
    */
    try {
        const [updatedRowsCount, updatedRoles] = await Rol.update(req.body, {
            where: { idRol: req.params.id }, // Asumiendo que la PK es idRol
            returning: true // Para PostgreSQL, retorna los registros actualizados
        });

        if (updatedRowsCount === 0) {
            return res.status(404).json({
                status: "0",
                msg: "Rol no encontrado para actualizar."
            });
        }

        res.status(200).json({
            status: "1",
            msg: "Rol actualizado.",
            rol: updatedRoles[0]
        });
    } catch (error) {
        console.error("Error en editRol:", error);
        res.status(400).json({
            status: "0",
            msg: "Error procesando la operación.",
            error: error.message
        });
    }
};

rolCtrl.deleteRol = async (req, res) => {
    /*
    #swagger.tags = ['Roles']
    #swagger.summary = 'Eliminar un Rol'
    #swagger.description = 'Elimina un rol de la base de datos usando su ID.'
    */
    try {
        // Antes de eliminar un rol, considera si hay usuarios asociados a él.
        // Si hay usuarios con este rol, la base de datos podría impedir la eliminación
        // (si tienes restricciones de clave externa configuradas) o podrías dejarlos
        // sin rol válido. Es buena práctica manejar esto:
        // 1. Reasignar usuarios a otro rol.
        // 2. Prohibir la eliminación si hay usuarios.
        // 3. Eliminar usuarios en cascada (generalmente no recomendado).
        // Por ahora, asumimos que la DB manejará la restricción o que no habrá usuarios asociados.

        const deletedRows = await Rol.destroy({
            where: { idRol: req.params.id } // Asumiendo que la PK es idRol
        });

        if (deletedRows === 0) {
            return res.status(404).json({
                status: "0",
                msg: "Rol no encontrado para eliminar."
            });
        }

        res.status(200).json({
            status: "1",
            msg: "Rol eliminado."
        });
    } catch (error) {
        console.error("Error en deleteRol:", error);
        // Capturar errores específicos de restricción de clave foránea si aplica
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(400).json({
                status: "0",
                msg: "No se puede eliminar el rol porque está asociado a uno o más usuarios.",
                error: error.message
            });
        }
        res.status(400).json({
            status: "0",
            msg: "Error procesando la operación.",
            error: error.message
        });
    }
};

rolCtrl.getRolFiltro = async (req, res) => {
    /*
    #swagger.tags = ['Roles']
    #swagger.summary = 'Filtrar Roles'
    #swagger.description = 'Retorna roles que coinciden con los criterios de filtro (nombre).'
    #swagger.parameters['nombre'] = { in: 'query', description: 'Filtra por nombre del rol.', type: 'string' }
    */
    const query = req.query;
    const criteria = {};

    if (query.nombre) {
        criteria.nombre = { [Op.iLike]: `%${query.nombre}%` };
    }

    try {
        const roles = await Rol.findAll({
            where: criteria
        });
        res.status(200).json(roles);
    } catch (error) {
        console.error("Error en getRolFiltro:", error);
        res.status(500).json({
            status: "0",
            msg: "Error procesando la operación.",
            error: error.message
        });
    }
};

module.exports = rolCtrl;