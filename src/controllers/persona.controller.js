const Persona = require("../models/Persona");
const { Op } = require('sequelize');

const personaCtrl = {};

personaCtrl.getPersonas = async (req, res) => {
    /*
    #swagger.tags = ['Personas']
    #swagger.summary = 'Obtener todas las Personas'
    #swagger.description = 'Retorna una lista de todas las personas registradas.'
    */
    try {
        const personas = await Persona.findAll();
        res.status(200).json(personas);
    } catch (error) {
        console.error("Error en getPersonas:", error);
        res.status(500).json({
            status: "0",
            msg: "Error procesando la operación.",
            error: error.message
        });
    }
};

personaCtrl.createPersona = async (req, res) => {
    /*
    #swagger.tags = ['Personas']
    #swagger.summary = 'Crear una nueva Persona'
    #swagger.description = 'Agrega una nueva persona a la base de datos.'
    #swagger.parameters['body'] = {
      in: 'body',
      description: 'Datos de la persona a crear.',
      required: true,
      schema: { $ref: '#/definitions/Persona' } // Asumiendo que has definido 'Persona' en tus definiciones de Swagger
    }
    */
    try {
        const persona = await Persona.create(req.body);
        res.status(201).json({
            status: "1",
            msg: "Persona guardada.",
            persona: persona
        });
    } catch (error) {
        console.error("Error en createPersona:", error);
        // Puedes añadir manejo de errores específicos aquí, como para DNI duplicado
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({
                status: "0",
                msg: "El DNI o la Licencia FEVA/FJA ya están registrados.",
                error: error.message
            });
        }
        res.status(400).json({
            status: "0",
            msg: "Error procesando operación.",
            error: error.message
        });
    }
};

personaCtrl.getPersona = async (req, res) => {
    /*
    #swagger.tags = ['Personas']
    #swagger.summary = 'Obtener Persona por ID'
    #swagger.description = 'Retorna una persona específica usando su ID.'
    */
    try {
        const persona = await Persona.findByPk(req.params.id);

        if (!persona) {
            return res.status(404).json({
                status: "0",
                msg: "Persona no encontrada."
            });
        }
        res.status(200).json(persona);
    } catch (error) {
        console.error("Error en getPersona:", error);
        res.status(500).json({
            status: "0",
            msg: "Error procesando la operación.",
            error: error.message
        });
    }
};

personaCtrl.editPersona = async (req, res) => {
    /*
    #swagger.tags = ['Personas']
    #swagger.summary = 'Actualizar una Persona'
    #swagger.description = 'Actualiza la información de una persona existente usando su ID.'
    #swagger.parameters['body'] = {
      in: 'body',
      description: 'Datos de la persona a actualizar.',
      required: true,
      schema: { $ref: '#/definitions/Persona' }
    }
    */
    try {
        const [updatedRowsCount, updatedPersonas] = await Persona.update(req.body, {
            where: { id: req.params.id },
            returning: true // Para PostgreSQL, retorna los registros actualizados
        });

        if (updatedRowsCount === 0) {
            return res.status(404).json({
                status: "0",
                msg: "Persona no encontrada para actualizar."
            });
        }

        res.status(200).json({
            status: "1",
            msg: "Persona actualizada.",
            persona: updatedPersonas[0]
        });
    } catch (error) {
        console.error("Error en editPersona:", error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({
                status: "0",
                msg: "El DNI o la Licencia FEVA/FJA ya están registrados en otra persona.",
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

personaCtrl.deletePersona = async (req, res) => {
    /*
    #swagger.tags = ['Personas']
    #swagger.summary = 'Eliminar una Persona'
    #swagger.description = 'Elimina una persona de la base de datos usando su ID.'
    */
    try {
        // Considera si hay relaciones con otras tablas (ej. Usuarios, Clubes, Jugadores)
        // Si hay claves foráneas en otras tablas que apuntan a 'Persona', la eliminación
        // podría fallar si no se gestiona la eliminación en cascada o la reasignación.
        const deletedRows = await Persona.destroy({
            where: { id: req.params.id }
        });

        if (deletedRows === 0) {
            return res.status(404).json({
                status: "0",
                msg: "Persona no encontrada para eliminar."
            });
        }

        res.status(200).json({
            status: "1",
            msg: "Persona eliminada."
        });
    } catch (error) {
        console.error("Error en deletePersona:", error);
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(400).json({
                status: "0",
                msg: "No se puede eliminar la persona porque está asociada a otros registros (ej. un usuario).",
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

personaCtrl.getPersonaFiltro = async (req, res) => {
    /*
    #swagger.tags = ['Personas']
    #swagger.summary = 'Filtrar Personas'
    #swagger.description = 'Retorna personas que coinciden con los criterios de filtro (nombreApellido, dni, tipo, categoria, fechaNacimiento, fechaLicencia).'
    #swagger.parameters['nombreApellido'] = { in: 'query', description: 'Filtra por nombre o apellido de la persona.', type: 'string' }
    #swagger.parameters['dni'] = { in: 'query', description: 'Filtra por DNI de la persona.', type: 'string' }
    #swagger.parameters['tipo'] = { in: 'query', description: 'Filtra por el tipo de persona (ej. Jugador, Entrenador).', type: 'string' }
    #swagger.parameters['categoria'] = { in: 'query', description: 'Filtra por la categoría de la persona.', type: 'string' }
    #swagger.parameters['fechaNacimientoDesde'] = { in: 'query', description: 'Filtra por fecha de nacimiento desde (YYYY-MM-DD).', type: 'string' }
    #swagger.parameters['fechaNacimientoHasta'] = { in: 'query', description: 'Filtra por fecha de nacimiento hasta (YYYY-MM-DD).', type: 'string' }
    #swagger.parameters['fechaLicenciaDesde'] = { in: 'query', description: 'Filtra por fecha de licencia desde (YYYY-MM-DD).', type: 'string' }
    #swagger.parameters['fechaLicenciaHasta'] = { in: 'query', description: 'Filtra por fecha de licencia hasta (YYYY-MM-DD).', type: 'string' }
    */
    const query = req.query;
    const criteria = {};

    if (query.nombreApellido) {
        criteria.nombreApellido = { [Op.iLike]: `%${query.nombreApellido}%` };
    }
    if (query.dni) {
        criteria.dni = { [Op.iLike]: `%${query.dni}%` };
    }
    if (query.tipo) {
        criteria.tipo = { [Op.iLike]: `%${query.tipo}%` };
    }
    if (query.categoria) {
        criteria.categoria = { [Op.iLike]: `%${query.categoria}%` };
    }

    // Filtros de rango de fechas
    if (query.fechaNacimientoDesde || query.fechaNacimientoHasta) {
        criteria.fechaNacimiento = {};
        if (query.fechaNacimientoDesde) {
            criteria.fechaNacimiento[Op.gte] = query.fechaNacimientoDesde;
        }
        if (query.fechaNacimientoHasta) {
            criteria.fechaNacimiento[Op.lte] = query.fechaNacimientoHasta;
        }
    }

    if (query.fechaLicenciaDesde || query.fechaLicenciaHasta) {
        criteria.fechaLicencia = {};
        if (query.fechaLicenciaDesde) {
            criteria.fechaLicencia[Op.gte] = query.fechaLicenciaDesde;
        }
        if (query.fechaLicenciaHasta) {
            criteria.fechaLicencia[Op.lte] = query.fechaLicenciaHasta;
        }
    }

    try {
        const personas = await Persona.findAll({
            where: criteria
        });
        res.status(200).json(personas);
    } catch (error) {
        console.error("Error en getPersonaFiltro:", error);
        res.status(500).json({
            status: "0",
            msg: "Error procesando la operación.",
            error: error.message
        });
    }
};

module.exports = personaCtrl;