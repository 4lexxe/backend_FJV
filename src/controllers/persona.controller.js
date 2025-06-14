// src/controllers/persona.controller.js
const Persona = require("../models/Persona");
const Club = require("../models/Club"); // Importa el modelo Club para la relación
const { Op } = require('sequelize');

const personaCtrl = {};

personaCtrl.getPersonas = async (req, res) => {
    /*
    #swagger.tags = ['Personas']
    #swagger.summary = 'Obtener todas las Personas'
    #swagger.description = 'Retorna una lista de todas las personas/afiliados registrados, incluyendo su club asociado.'
    */
    try {
        const personas = await Persona.findAll({
            include: {
                model: Club,
                as: 'club', // Alias definido en Persona.belongsTo(Club) en index.js
                attributes: ['idClub', 'nombre'] // Atributos del club a incluir
            },
            order: [
                ['categoria', 'ASC'],
                ['nombreApellido', 'ASC']
            ]
        });
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
    #swagger.description = 'Agrega una nueva persona/afiliado a la base de datos. Puede incluir idClub para asociarla a un club existente.'
    #swagger.parameters['body'] = {
        in: 'body',
        description: 'Datos de la persona a crear.',
        required: true,
        schema: { $ref: '#/definitions/Persona' } // Asumiendo que has definido 'Persona' en tus definiciones de Swagger
    }
    */
    try {
        const existente = await Persona.findOne({ where: { dni: req.body.dni } });
        if (existente) {
            return res.status(409).json({
                status: "0",
                msg: `Ya existe una persona con el DNI ${req.body.dni}`
            });
        }

        if (req.body.idClub) {
            const clubExiste = await Club.findByPk(req.body.idClub);
            if (!clubExiste) {
                return res.status(400).json({
                    status: "0",
                    msg: `El club con ID ${req.body.idClub} no existe`
                });
            }
        }

        const persona = await Persona.create(req.body);
        res.status(201).json({
            status: "1",
            msg: "Persona/Afiliado creado correctamente",
            persona: persona
        });
    } catch (error) {
        console.error("Error en createPersona:", error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                status: "0",
                msg: 'Datos inválidos',
                errors: error.errors.map(e => ({ field: e.path, message: e.message }))
            });
        }
        res.status(500).json({
            status: "0",
            msg: "Error procesando la operación.",
            error: error.message
        });
    }
};

personaCtrl.getPersona = async (req, res) => {
    /*
    #swagger.tags = ['Personas']
    #swagger.summary = 'Obtener Persona por ID'
    #swagger.description = 'Retorna una persona específica usando su ID, incluyendo su club asociado.'
    */
    try {
        const persona = await Persona.findByPk(req.params.id, {
            include: {
                model: Club,
                as: 'club',
                attributes: ['idClub', 'nombre']
            }
        });

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
    #swagger.description = 'Actualiza la información de una persona existente usando su ID. Permite modificar datos de afiliación.'
    #swagger.parameters['body'] = {
        in: 'body',
        description: 'Datos de la persona a actualizar.',
        required: true,
        schema: { $ref: '#/definitions/Persona' }
    }
    */
    try {
        if (req.body.idClub) {
            const clubExiste = await Club.findByPk(req.body.idClub);
            if (!clubExiste) {
                return res.status(400).json({
                    status: "0",
                    msg: `El club con ID ${req.body.idClub} no existe`
                });
            }
        }

        const persona = await Persona.findByPk(req.params.id);
        if (!persona) {
            return res.status(404).json({
                status: "0",
                msg: "Persona no encontrada para actualizar"
            });
        }

        await persona.update(req.body);
        res.status(200).json({
            status: "1",
            msg: "Persona/Afiliado actualizado correctamente",
            persona: persona
        });
    } catch (error) {
        console.error("Error en editPersona:", error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                status: "0",
                msg: 'Datos inválidos',
                errors: error.errors.map(e => ({ field: e.path, message: e.message }))
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
    #swagger.description = 'Elimina una persona/afiliado de la base de datos usando su ID.'
    */
    try {
        const persona = await Persona.findByPk(req.params.id);
        if (!persona) {
            return res.status(404).json({
                status: "0",
                msg: "Persona no encontrada"
            });
        }

        await persona.destroy();
        res.status(200).json({
            status: "1",
            msg: "Persona/Afiliado eliminado correctamente"
        });
    } catch (error) {
        console.error("Error en deletePersona:", error);
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(400).json({
                status: "0",
                msg: "No se puede eliminar la persona porque está asociada a otros registros",
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
    #swagger.description = 'Retorna personas que coinciden con los criterios de filtro (nombreApellido, dni, tipo, categorias, tipo, etc).'
    #swagger.parameters['nombreApellido'] = { in: 'query', description: 'Filtra por nombre o apellido de la persona.', type: 'string' }
    #swagger.parameters['dni'] = { in: 'query', description: 'Filtra por DNI de la persona.', type: 'string' }
    #swagger.parameters['tipo'] = { in: 'query', description: 'Filtra por el tipo de persona (ej. Jugador, Entrenador).', type: 'string' }
    #swagger.parameters['categoria'] = { in: 'query', description: 'Filtra por la categoría de la persona.', type: 'string' }
    #swagger.parameters['categoriaNivel'] = { in: 'query', description: 'Filtra por el nivel de la categoría de la persona.', type: 'string' }
    #swagger.parameters['fechaNacimientoDesde'] = { in: 'query', description: 'Filtra por fecha de nacimiento desde (YYYY-MM-DD).', type: 'string' }
    #swagger.parameters['fechaNacimientoHasta'] = { in: 'query', description: 'Filtra por fecha de nacimiento hasta (YYYY-MM-DD).', type: 'string' }
    #swagger.parameters['fechaLicenciaDesde'] = { in: 'query', description: 'Filtra por fecha de licencia desde (YYYY-MM-DD).', type: 'string' }
    #swagger.parameters['fechaLicenciaHasta'] = { in: 'query', description: 'Filtra por fecha de licencia hasta (YYYY-MM-DD).', type: 'string' }
    #swagger.parameters['fechaAltaDesde'] = { in: 'query', description: 'Filtra por fecha de alta desde (YYYY-MM-DD).', type: 'string' }
    #swagger.parameters['fechaAltaHasta'] = { in: 'query', description: 'Filtra por fecha de alta hasta (YYYY-MM-DD).', type: 'string' }
    #swagger.parameters['idClub'] = { in: 'query', description: 'Filtra por ID del Club asociado.', type: 'integer' }
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
    if (query.categoriaNivel) {
        criteria.categoriaNivel = { [Op.iLike]: `%${query.categoriaNivel}%` };
    }
    if (query.idClub) {
        criteria.idClub = query.idClub;
    }

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

    if (query.fechaAltaDesde || query.fechaAltaHasta) {
        criteria.fechaAlta = {};
        if (query.fechaAltaDesde) {
            criteria.fechaAlta[Op.gte] = query.fechaAltaDesde;
        }
        if (query.fechaAltaHasta) {
            criteria.fechaAlta[Op.lte] = query.fechaAltaHasta;
        }
    }

    try {
        const personas = await Persona.findAll({
            where: criteria,
            include: {
                model: Club,
                as: 'club',
                attributes: ['idClub', 'nombre']
            },
            order: [
                ['categoria', 'ASC'],
                ['nombreApellido', 'ASC']
            ]
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

personaCtrl.importarPersonas = async (req, res) => {
    try {
        const personas = req.body;

        if (!Array.isArray(personas) || personas.length === 0) {
            return res.status(400).json({
                status: "0",
                msg: 'No se proporcionaron datos para importar'
            });
        }

        const resultados = await Persona.bulkCreate(personas, {
            validate: true,
            fields: [
                'nombreApellido', 'dni', 'fechaNacimiento', 'tipo',
                'categoria', 'categoriaNivel', 'fechaAlta',
                'clubActual', 'paseClub', 'otorgado', 'idClub',
                'licenciaFEVA', 'fechaLicencia'
            ]
        });

        res.status(201).json({
            status: "1",
            msg: `${resultados.length} personas/afiliados importados correctamente`,
            count: resultados.length
        });
    } catch (error) {
        console.error('Error al importar personas:', error);
        if (error.name === 'SequelizeBulkRecordError') {
            return res.status(400).json({
                status: "0",
                msg: 'Error en los datos proporcionados',
                errors: error.errors
            });
        }

        res.status(500).json({
            status: "0",
            msg: 'Error al importar personas',
            error: error.message
        });
    }
};

module.exports = personaCtrl;