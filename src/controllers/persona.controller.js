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
    #swagger.description = 'Agrega una nueva persona a la base de datos. Puede incluir idClub para asociarla a un club existente y foto de perfil (máximo 4MB).'
    #swagger.parameters['body'] = {
        in: 'body',
        description: 'Datos de la persona a crear.',
        required: true,
        schema: { $ref: '#/definitions/Persona' }
    }
    */
    try {
        console.log('Datos recibidos en req.body:', req.body);
        console.log('Archivo recibido:', req.file ? 'Sí' : 'No');
        console.log('Datos de imagen procesados:', req.imageData ? 'Sí' : 'No');

        // Extraer datos del cuerpo de la solicitud
        const { idClub, ...personaData } = req.body;

        // Validaciones básicas de campos obligatorios
        if (!personaData.nombreApellido || personaData.nombreApellido.trim() === '') {
            return res.status(400).json({
                status: "0",
                msg: "El nombre y apellido son obligatorios"
            });
        }

        if (!personaData.dni || personaData.dni.trim() === '') {
            return res.status(400).json({
                status: "0",
                msg: "El DNI es obligatorio"
            });
        }

        if (!personaData.fechaNacimiento || personaData.fechaNacimiento.trim() === '') {
            return res.status(400).json({
                status: "0",
                msg: "La fecha de nacimiento es obligatoria"
            });
        }

        // Validar formato de fecha
        const fechaNacimiento = new Date(personaData.fechaNacimiento);
        if (isNaN(fechaNacimiento.getTime())) {
            return res.status(400).json({
                status: "0",
                msg: "Formato de fecha de nacimiento inválido. Use YYYY-MM-DD"
            });
        }

        // Limpiar datos de cadenas vacías y convertir a null si es necesario
        Object.keys(personaData).forEach(key => {
            if (typeof personaData[key] === 'string' && personaData[key].trim() === '') {
                personaData[key] = null;
            }
        });

        // Agregar datos de imagen si se subió una foto
        if (req.imageData) {
            Object.assign(personaData, req.imageData);
        }

        // Opcional: Validar que el Club exista si se proporciona idClub
        if (idClub && idClub !== '' && idClub !== 'null') {
            const clubExistente = await Club.findByPk(idClub);
            if (!clubExistente) {
                return res.status(400).json({
                    status: "0",
                    msg: `El Club con ID ${idClub} no existe.`
                });
            }
        }

        // Preparar datos finales para crear la persona
        const datosFinales = {
            ...personaData,
            idClub: (idClub && idClub !== '' && idClub !== 'null') ? parseInt(idClub) : null
        };

        console.log('Datos finales para crear persona:', datosFinales);

        const persona = await Persona.create(datosFinales);
        
        // Preparar respuesta sin incluir la imagen base64 completa (por tamaño)
        const personaResponse = persona.toJSON();
        if (personaResponse.fotoPerfil) {
            personaResponse.fotoPerfil = `[IMAGEN_BASE64_${personaResponse.fotoPerfilTamano}_BYTES]`;
        }
        
        res.status(201).json({
            status: "1",
            msg: "Persona guardada exitosamente.",
            persona: personaResponse
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
        if (error.name === 'SequelizeValidationError') {
            const errores = error.errors.map(err => ({
                campo: err.path,
                mensaje: err.message,
                valor: err.value
            }));
            return res.status(400).json({
                status: "0",
                msg: "Error de validación de datos",
                errores: errores
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
    #swagger.description = 'Retorna una persona específica usando su ID, incluyendo su club asociado y foto de perfil.'
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
    #swagger.description = 'Actualiza la información de una persona existente usando su ID. Permite modificar idClub para reasignar a un club y actualizar foto de perfil.'
    #swagger.parameters['body'] = {
        in: 'body',
        description: 'Datos de la persona a actualizar.',
        required: true,
        schema: { $ref: '#/definitions/Persona' }
    }
    */
    try {
        console.log('Editando persona - Datos recibidos:', req.body);
        console.log('Archivo recibido:', req.file ? 'Sí' : 'No');

        // Verificar que la persona existe
        const personaExistente = await Persona.findByPk(req.params.id);
        if (!personaExistente) {
            return res.status(404).json({
                status: "0",
                msg: "Persona no encontrada para actualizar."
            });
        }

        const { idClub, ...personaData } = req.body;

        // Limpiar datos de cadenas vacías y convertir a null si es necesario
        Object.keys(personaData).forEach(key => {
            if (typeof personaData[key] === 'string' && personaData[key].trim() === '') {
                personaData[key] = null;
            }
        });

        // Validaciones básicas solo si se están actualizando
        if (personaData.hasOwnProperty('nombreApellido') && (!personaData.nombreApellido || personaData.nombreApellido.trim() === '')) {
            return res.status(400).json({
                status: "0",
                msg: "El nombre y apellido no pueden estar vacíos"
            });
        }

        if (personaData.hasOwnProperty('dni') && (!personaData.dni || personaData.dni.trim() === '')) {
            return res.status(400).json({
                status: "0",
                msg: "El DNI no puede estar vacío"
            });
        }

        if (personaData.hasOwnProperty('fechaNacimiento')) {
            if (!personaData.fechaNacimiento) {
                return res.status(400).json({
                    status: "0",
                    msg: "La fecha de nacimiento no puede estar vacía"
                });
            }
            const fechaNacimiento = new Date(personaData.fechaNacimiento);
            if (isNaN(fechaNacimiento.getTime())) {
                return res.status(400).json({
                    status: "0",
                    msg: "Formato de fecha de nacimiento inválido. Use YYYY-MM-DD"
                });
            }
        }

        // Agregar datos de imagen si se subió una nueva foto
        if (req.imageData) {
            Object.assign(personaData, req.imageData);
        }

        // Opcional: Validar que el Club exista si se proporciona idClub
        if (idClub && idClub !== '' && idClub !== 'null') {
            const clubExistente = await Club.findByPk(idClub);
            if (!clubExistente) {
                return res.status(400).json({
                    status: "0",
                    msg: `El Club con ID ${idClub} no existe.`
                });
            }
        }

        // Preparar datos finales para actualizar
        const datosFinales = {
            ...personaData,
            ...(idClub !== undefined && { idClub: (idClub && idClub !== '' && idClub !== 'null') ? parseInt(idClub) : null })
        };

        console.log('Datos finales para actualizar:', datosFinales);

        await personaExistente.update(datosFinales);

        // Recargar la persona actualizada con sus asociaciones
        const personaActualizada = await Persona.findByPk(req.params.id, {
            include: {
                model: Club,
                as: 'club',
                attributes: ['idClub', 'nombre']
            }
        });

        // Preparar respuesta sin incluir la imagen base64 completa
        const personaResponse = personaActualizada.toJSON();
        if (personaResponse.fotoPerfil) {
            personaResponse.fotoPerfil = `[IMAGEN_BASE64_${personaResponse.fotoPerfilTamano}_BYTES]`;
        }

        res.status(200).json({
            status: "1",
            msg: "Persona actualizada exitosamente.",
            persona: personaResponse
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
        if (error.name === 'SequelizeValidationError') {
            const errores = error.errors.map(err => ({
                campo: err.path,
                mensaje: err.message,
                valor: err.value
            }));
            return res.status(400).json({
                status: "0",
                msg: "Error de validación de datos",
                errores: errores
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
            where: { idPersona: req.params.id }
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

// Nuevo endpoint para obtener solo la foto de perfil
personaCtrl.getFotoPerfil = async (req, res) => {
    /*
    #swagger.tags = ['Personas']
    #swagger.summary = 'Obtener foto de perfil de una Persona'
    #swagger.description = 'Retorna la foto de perfil de una persona en formato base64.'
    */
    try {
        const persona = await Persona.findByPk(req.params.id, {
            attributes: ['idPersona', 'nombreApellido', 'fotoPerfil', 'fotoPerfilTipo', 'fotoPerfilTamano']
        });

        if (!persona) {
            return res.status(404).json({
                status: "0",
                msg: "Persona no encontrada."
            });
        }

        if (!persona.fotoPerfil) {
            return res.status(404).json({
                status: "0",
                msg: "Esta persona no tiene foto de perfil."
            });
        }

        res.status(200).json({
            status: "1",
            msg: "Foto de perfil obtenida exitosamente",
            foto: {
                idPersona: persona.idPersona,
                nombreApellido: persona.nombreApellido,
                fotoPerfil: persona.fotoPerfil,
                tipo: persona.fotoPerfilTipo,
                tamano: persona.fotoPerfilTamano
            }
        });
    } catch (error) {
        console.error("Error en getFotoPerfil:", error);
        res.status(500).json({
            status: "0",
            msg: "Error procesando la operación.",
            error: error.message
        });
    }
};

// Nuevo endpoint para eliminar foto de perfil
personaCtrl.deleteFotoPerfil = async (req, res) => {
    /*
    #swagger.tags = ['Personas']
    #swagger.summary = 'Eliminar foto de perfil de una Persona'
    #swagger.description = 'Elimina la foto de perfil de una persona específica.'
    */
    try {
        const persona = await Persona.findByPk(req.params.id);

        if (!persona) {
            return res.status(404).json({
                status: "0",
                msg: "Persona no encontrada."
            });
        }

        // Actualizar campos relacionados con la foto
        await persona.update({
            fotoPerfil: null,
            fotoPerfilTipo: null,
            fotoPerfilTamano: null
        });

        res.status(200).json({
            status: "1",
            msg: "Foto de perfil eliminada exitosamente"
        });
    } catch (error) {
        console.error("Error en deleteFotoPerfil:", error);
        res.status(500).json({
            status: "0",
            msg: "Error procesando la operación.",
            error: error.message
        });
    }
};

module.exports = personaCtrl;