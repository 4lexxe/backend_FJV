// src/controllers/persona.controller.js
const Persona = require("../models/Persona");
const Club = require("../models/Club"); // Importa el modelo Club para la relación
const { Op } = require('sequelize');


const personaCtrl = {};

personaCtrl.getPersonas = async (req, res) => {
    /*
    #swagger.tags = ['Personas']
    #swagger.summary = 'Obtener todas las Personas'
    #swagger.description = 'Retorna una lista de todas las personas registradas, incluyendo su club asociado.'
    */
    try {
        const personas = await Persona.findAll({
            include: {
                model: Club,
                as: 'club', // Alias definido en Persona.belongsTo(Club) en index.js
                attributes: ['idClub', 'nombre'] // Atributos del club a incluir
            }
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
    #swagger.description = 'Agrega una nueva persona a la base de datos. Puede incluir idClub para asociarla a un club existente.'
    #swagger.parameters['body'] = {
        in: 'body',
        description: 'Datos de la persona a crear.',
        required: true,
        schema: { $ref: '#/definitions/Persona' } // Asumiendo que has definido 'Persona' en tus definiciones de Swagger
    }
    */
    try {
        // Extraemos TODOS los campos esperados del body para mayor claridad y seguridad.
        const { 
            idClub,
            nombreApellido,
            dni,
            tipo,
            licencia, // Este campo recibirá 'Feva' o 'FJV'
            fechaLicencia,
            ...otrosDatos 
        } = req.body;

        // Opcional: Validar que el Club exista si se proporciona idClub
        if (idClub) {
            const clubExistente = await Club.findByPk(idClub);
            if (!clubExistente) {
                return res.status(400).json({
                    status: "0",
                    msg: `El Club con ID ${idClub} no existe.`
                });
            }
        }

        // Creamos el objeto persona con los campos explícitos.
        const persona = await Persona.create({ 
            idClub,
            nombreApellido,
            dni,
            tipo,
            licencia,
            fechaLicencia,
            ...otrosDatos // Incluimos cualquier otro dato que pueda venir
        });
        res.status(201).json({
            status: "1",
            msg: "Persona guardada.",
            persona: persona
        });
    } catch (error) {
        console.error("Error en createPersona:", error);
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
    #swagger.description = 'Actualiza la información de una persona existente usando su ID. Permite modificar idClub para reasignar a un club.'
    #swagger.parameters['body'] = {
        in: 'body',
        description: 'Datos de la persona a actualizar.',
        required: true,
        schema: { $ref: '#/definitions/Persona' }
    }
    */
    try {
        const personaData = req.body; // Usamos el body completo para la actualización

        // Opcional: Validar que el Club exista si se proporciona idClub
        if (personaData.idClub) {
            const clubExistente = await Club.findByPk(personaData.idClub);
            if (!clubExistente) {
                return res.status(400).json({
                    status: "0",
                    msg: `El Club con ID ${personaData.idClub} no existe.`
                });
            }
        }

        const [updatedRowsCount, updatedPersonas] = await Persona.update(personaData, {
            where: { idPersona: req.params.id }, // **CAMBIADO a idPersona**
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
        const deletedRows = await Persona.destroy({
            where: { idPersona: req.params.id } // **CAMBIADO a idPersona**
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
                msg: "No se puede eliminar la persona porque está asociada a otros registros (ej. un usuario, si hubiese más tablas que referencian a persona) o no tiene configurada la eliminación en cascada.",
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
    #swagger.description = 'Retorna personas que coinciden con los criterios de filtro (nombreApellido, dni, tipo, categoria, fechaNacimiento, fechaLicencia, idClub).'
    #swagger.parameters['nombreApellido'] = { in: 'query', description: 'Filtra por nombre o apellido de la persona.', type: 'string' }
    #swagger.parameters['dni'] = { in: 'query', description: 'Filtra por DNI de la persona.', type: 'string' }
    #swagger.parameters['tipo'] = { in: 'query', description: 'Filtra por el tipo de persona (ej. Jugador, Entrenador).', type: 'string' }
    #swagger.parameters['categoria'] = { in: 'query', description: 'Filtra por la categoría de la persona.', type: 'string' }
    #swagger.parameters['fechaNacimientoDesde'] = { in: 'query', description: 'Filtra por fecha de nacimiento desde (YYYY-MM-DD).', type: 'string' }
    #swagger.parameters['fechaNacimientoHasta'] = { in: 'query', description: 'Filtra por fecha de nacimiento hasta (YYYY-MM-DD).', type: 'string' }
    #swagger.parameters['fechaLicenciaDesde'] = { in: 'query', description: 'Filtra por fecha de licencia desde (YYYY-MM-DD).', type: 'string' }
    #swagger.parameters['fechaLicenciaHasta'] = { in: 'query', description: 'Filtra por fecha de licencia hasta (YYYY-MM-DD).', type: 'string' }
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
    if (query.idClub) {
        criteria.idClub = query.idClub; // Se asume que idClub es un número
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
            where: criteria,
            include: { // Incluye el club asociado si se filtra por club o simplemente quieres verlo
                model: Club,
                as: 'club',
                attributes: ['idClub', 'nombre']
            }
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

personaCtrl.getPersonaFoto = async (req, res) => {
    /*
    #swagger.tags = ['Personas']
    #swagger.summary = 'Obtener foto de Persona por ID'
    #swagger.description = 'Retorna la URL de la foto de una persona específica.'
    */
    try {
        const persona = await Persona.findByPk(req.params.id, {
            attributes: ['foto']
        });

        if (!persona || !persona.foto) {
            return res.status(404).json({
                status: "0",
                msg: "La persona no tiene una foto de perfil."
            });
        }

        res.status(200).json({
            status: "1",
            msg: "Foto obtenida correctamente.",
            foto: {
                fotoPerfilUrl: persona.foto
            }
        });
    } catch (error) {
        console.error("Error en getPersonaFoto:", error);
        res.status(500).json({
            status: "0",
            msg: "Error procesando la operación.",
            error: error.message
        });
    }
};

personaCtrl.renovarLicencia = async (req, res) => {
    /*
    #swagger.tags = ['Personas']
    #swagger.summary = 'Renovar la licencia de una Persona'
    #swagger.description = 'Extiende la fecha de vencimiento de la licencia de una persona por un año.'
    */
    try {
        const persona = await Persona.findByPk(req.params.id);

        if (!persona) {
            return res.status(404).json({ status: "0", msg: "Persona no encontrada." });
        }

        const hoy = new Date();
        const fechaVencimiento = new Date();
        fechaVencimiento.setFullYear(hoy.getFullYear() + 1);

        await persona.update({
            fechaLicencia: hoy.toISOString().substring(0, 10),
            fechaLicenciaBaja: fechaVencimiento.toISOString().substring(0, 10),
            estadoLicencia: 'ACTIVO'
        });

        const personaActualizada = await Persona.findByPk(req.params.id, { include: { model: Club, as: 'club' } });

        res.status(200).json(personaActualizada);
    } catch (error) {
        console.error("Error en renovarLicencia:", error);
        res.status(500).json({ status: "0", msg: "Error procesando la operación.", error: error.message });
    }
};

personaCtrl.deleteFotoPerfil = async (req, res) => {
    /*
    #swagger.tags = ['Personas']
    #swagger.summary = 'Eliminar foto de perfil de una Persona'
    #swagger.description = 'Elimina la URL de la foto de una persona, estableciéndola a null.'
    */
    try {
        const persona = await Persona.findByPk(req.params.id);
        if (!persona) {
            return res.status(404).json({ status: "0", msg: "Persona no encontrada." });
        }

        await persona.update({ foto: null });

        res.status(200).json({ status: "1", msg: "Foto de perfil eliminada." });
    } catch (error) {
        console.error("Error en deleteFotoPerfil:", error);
        res.status(500).json({ status: "0", msg: "Error procesando la operación.", error: error.message });
    }
};

personaCtrl.actualizarEstadoLicencias = async (req, res) => {
    /*
    #swagger.tags = ['Personas']
    #swagger.summary = 'Actualizar estados de todas las licencias'
    #swagger.description = 'Recorre todas las personas y actualiza su estado de licencia a "VENCIDO" si la fecha de baja ha pasado.'
    */
    try {
        const hoy = new Date();
        const [updatedCount] = await Persona.update(
            { estadoLicencia: 'VENCIDO' },
            {
                where: {
                    estadoLicencia: 'ACTIVO',
                    fechaLicenciaBaja: {
                        [Op.lt]: hoy
                    }
                }
            }
        );

        res.status(200).json({
            status: "1",
            msg: `Operación completada. ${updatedCount} licencias actualizadas a "VENCIDO".`
        });
    } catch (error) {
        console.error("Error en actualizarEstadoLicencias:", error);
        res.status(500).json({ status: "0", msg: "Error procesando la operación.", error: error.message });
    }
};

// --- Controladores de Estadísticas ---

personaCtrl.getResumen = async (req, res) => {
    /*
    #swagger.tags = ['Estadísticas']
    #swagger.summary = 'Obtener un resumen general'
    */
    try {
        const totalAfiliados = await Persona.count();
        const licenciasActivas = await Persona.count({ where: { estadoLicencia: 'ACTIVO' } });
        const totalClubes = await Club.count();

        res.status(200).json({
            totalAfiliados,
            licenciasActivas,
            totalClubes
        });
    } catch (error) {
        res.status(500).json({ msg: "Error al obtener el resumen", error: error.message });
    }
};

personaCtrl.getCantidadPorCategoria = async (req, res) => {
    /*
    #swagger.tags = ['Estadísticas']
    #swagger.summary = 'Obtener cantidad de afiliados por tipo'
    */
    try {
        const cantidadPorTipo = await Persona.findAll({
            attributes: ['tipo', [Persona.sequelize.fn('COUNT', Persona.sequelize.col('tipo')), 'cantidad']],
            group: ['tipo'],
            order: [[Persona.sequelize.fn('COUNT', Persona.sequelize.col('tipo')), 'DESC']]
        });
        res.status(200).json(cantidadPorTipo);
    } catch (error) {
        res.status(500).json({ msg: "Error al obtener cantidad por tipo", error: error.message });
    }
};

personaCtrl.getCantidadPorClub = async (req, res) => {
    /*
    #swagger.tags = ['Estadísticas']
    #swagger.summary = 'Obtener cantidad de afiliados por club'
    */
    try {
        const cantidadPorClub = await Persona.findAll({
            attributes: [[Persona.sequelize.fn('COUNT', Persona.sequelize.col('Persona.idPersona')), 'cantidad']],
            include: {
                model: Club,
                as: 'club',
                attributes: ['nombre']
            },
            group: ['club.idClub', 'club.nombre'],
            order: [[Persona.sequelize.fn('COUNT', Persona.sequelize.col('Persona.idPersona')), 'DESC']]
        });

        // Formatear para que sea más amigable
        const resultado = cantidadPorClub.map(item => ({
            club: item.club.nombre,
            cantidad: item.get('cantidad')
        }));

        res.status(200).json(resultado);
    } catch (error) {
        res.status(500).json({ msg: "Error al obtener cantidad por club", error: error.message });
    }
};

module.exports = personaCtrl;
