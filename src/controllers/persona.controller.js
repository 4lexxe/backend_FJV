// src/controllers/persona.controller.js
const Persona = require("../models/Persona");
const Club = require("../models/Club"); // Importa el modelo Club para la relación
const Credencial = require("../models/Credencial"); // Importar el modelo Credencial
const imgbbService = require("../services/imgbb.service"); // Importar servicio ImgBB
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

const personaCtrl = {};

personaCtrl.getPersonas = async (req, res) => {
    /*
    #swagger.tags = ['Personas']
    #swagger.summary = 'Obtener todas las Personas'
    #swagger.description = 'Retorna una lista de todas las personas registradas, incluyendo su club asociado y credencial.'
    */
    try {
        const personas = await Persona.findAll({
            include: [
                {
                    model: Club,
                    as: 'club', 
                    attributes: ['idClub', 'nombre']
                },
                {
                    model: Credencial,
                    as: 'credenciales',
                    attributes: ['idCredencial', 'identificador', 'fechaAlta', 'fechaVencimiento', 'estado']
                }
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
    #swagger.description = 'Agrega una nueva persona a la base de datos con una credencial asociada. Puede incluir idClub para asociarla a un club existente y foto de perfil (máximo 4MB) que se subirá a ImgBB.'
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

        // Establecer fechas de licencia
        const fechaLicencia = personaData.fechaLicencia 
            ? new Date(personaData.fechaLicencia) 
            : new Date();
        
        if (personaData.fechaLicencia && isNaN(new Date(personaData.fechaLicencia).getTime())) {
            return res.status(400).json({
                status: "0",
                msg: "Formato de fecha de licencia inválido. Use YYYY-MM-DD"
            });
        }
        
        const fechaLicenciaBaja = new Date(fechaLicencia);
        fechaLicenciaBaja.setFullYear(fechaLicenciaBaja.getFullYear() + 1);
        
        personaData.fechaLicencia = fechaLicencia.toISOString().split('T')[0];
        personaData.fechaLicenciaBaja = fechaLicenciaBaja.toISOString().split('T')[0];
        personaData.estadoLicencia = 'ACTIVO';

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

        const datosFinales = {
            ...personaData,
            idClub: (idClub && idClub !== '' && idClub !== 'null') ? parseInt(idClub) : null
        };

        console.log('Datos finales para crear persona:', datosFinales);

        const transaction = await sequelize.transaction();

        try {
            const persona = await Persona.create(datosFinales, { transaction });
            
            const fechaAlta = new Date(personaData.fechaLicencia);
            const fechaVencimiento = new Date(personaData.fechaLicenciaBaja);
            
            const identificador = `FJV-${persona.idPersona}-${fechaAlta.getFullYear()}`;
            
            const fechaActual = new Date();
            const estado = fechaVencimiento >= fechaActual ? 'ACTIVO' : 'INACTIVO';
            
            const credencial = await Credencial.create({
                identificador,
                fechaAlta: fechaAlta.toISOString().split('T')[0],
                fechaVencimiento: fechaVencimiento.toISOString().split('T')[0],
                estado,
                idPersona: persona.idPersona
            }, { transaction });
            
            await transaction.commit();
            
            const personaConCredencial = {
                ...persona.toJSON(),
                credencial: credencial.toJSON()
            };

            res.status(201).json({
                status: "1",
                msg: "Persona guardada exitosamente con su credencial.",
                persona: personaConCredencial
            });
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
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
    #swagger.description = 'Retorna una persona específica usando su ID, incluyendo su club asociado, credencial y foto de perfil.'
    */
    try {
        const persona = await Persona.findByPk(req.params.id, {
            include: [
                {
                    model: Club,
                    as: 'club',
                    attributes: ['idClub', 'nombre']
                },
                {
                    model: Credencial,
                    as: 'credenciales',
                    attributes: ['idCredencial', 'identificador', 'fechaAlta', 'fechaVencimiento', 'estado']
                }
            ]
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
    #swagger.description = 'Actualiza la información de una persona existente y sincroniza los datos de licencia con su credencial.'
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

        const personaExistente = await Persona.findByPk(req.params.id, {
            include: {
                model: Credencial,
                as: 'credenciales'
            }
        });
        
        if (!personaExistente) {
            return res.status(404).json({
                status: "0",
                msg: "Persona no encontrada para actualizar."
            });
        }

        const { idClub, ...personaData } = req.body;

        Object.keys(personaData).forEach(key => {
            if (typeof personaData[key] === 'string' && personaData[key].trim() === '') {
                personaData[key] = null;
            }
        });

        const transaction = await sequelize.transaction();
        
        try {
            if (personaData.hasOwnProperty('fechaLicencia') && personaData.fechaLicencia) {
                const fechaLicencia = new Date(personaData.fechaLicencia);
                
                const fechaLicenciaBaja = new Date(fechaLicencia);
                fechaLicenciaBaja.setFullYear(fechaLicenciaBaja.getFullYear() + 1);
                
                personaData.fechaLicenciaBaja = fechaLicenciaBaja.toISOString().split('T')[0];
                
                const fechaActual = new Date();
                personaData.estadoLicencia = fechaLicenciaBaja >= fechaActual ? 'ACTIVO' : 'INACTIVO';
                
                if (personaExistente.credenciales && personaExistente.credenciales.length > 0) {
                    const credencialActual = personaExistente.credenciales[0];
                    
                    await credencialActual.update({
                        fechaAlta: fechaLicencia.toISOString().split('T')[0],
                        fechaVencimiento: fechaLicenciaBaja.toISOString().split('T')[0],
                        estado: personaData.estadoLicencia
                    }, { transaction });
                } else {
                    const identificador = `FJV-${personaExistente.idPersona}-${fechaLicencia.getFullYear()}`;
                    
                    await Credencial.create({
                        identificador,
                        fechaAlta: fechaLicencia.toISOString().split('T')[0],
                        fechaVencimiento: fechaLicenciaBaja.toISOString().split('T')[0],
                        estado: personaData.estadoLicencia,
                        idPersona: personaExistente.idPersona
                    }, { transaction });
                }
            }

            if (req.imageData && personaExistente.fotoPerfilDeleteUrl) {
                try {
                    await imgbbService.deleteImage(personaExistente.fotoPerfilDeleteUrl);
                    console.log('Imagen anterior eliminada de ImgBB');
                } catch (deleteError) {
                    console.error('Error eliminando imagen anterior de ImgBB:', deleteError);
                }
            }

            if (req.imageData) {
                Object.assign(personaData, req.imageData);
            }

            const datosFinales = {
                ...personaData,
                ...(idClub !== undefined && { idClub: (idClub && idClub !== '' && idClub !== 'null') ? parseInt(idClub) : null })
            };

            await personaExistente.update(datosFinales, { transaction });
            
            await transaction.commit();

            const personaActualizada = await Persona.findByPk(req.params.id, {
                include: [
                    {
                        model: Club,
                        as: 'club',
                        attributes: ['idClub', 'nombre']
                    },
                    {
                        model: Credencial,
                        as: 'credenciales'
                    }
                ]
            });

            res.status(200).json({
                status: "1",
                msg: "Persona actualizada exitosamente con su credencial sincronizada.",
                persona: personaActualizada
            });
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
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

personaCtrl.renovarLicencia = async (req, res) => {
    /*
    #swagger.tags = ['Personas']
    #swagger.summary = 'Renovar licencia y credencial de una Persona'
    #swagger.description = 'Actualiza las fechas de licencia y credencial, extendiendo su validez por un año más.'
    */
    try {
        const persona = await Persona.findByPk(req.params.id, {
            include: {
                model: Credencial,
                as: 'credenciales'
            }
        });
        
        if (!persona) {
            return res.status(404).json({
                status: "0",
                msg: "Persona no encontrada."
            });
        }
        
        const transaction = await sequelize.transaction();
        
        try {
            const fechaLicencia = new Date();
            const fechaLicenciaBaja = new Date();
            fechaLicenciaBaja.setFullYear(fechaLicenciaBaja.getFullYear() + 1);
            
            await persona.update({
                fechaLicencia: fechaLicencia.toISOString().split('T')[0],
                fechaLicenciaBaja: fechaLicenciaBaja.toISOString().split('T')[0],
                estadoLicencia: 'ACTIVO'
            }, { transaction });
            
            if (persona.credenciales && persona.credenciales.length > 0) {
                const credencialActual = persona.credenciales[0];
                
                await credencialActual.update({
                    fechaAlta: fechaLicencia.toISOString().split('T')[0],
                    fechaVencimiento: fechaLicenciaBaja.toISOString().split('T')[0],
                    estado: 'ACTIVO'
                }, { transaction });
            } else {
                const identificador = `FJV-${persona.idPersona}-${fechaLicencia.getFullYear()}`;
                
                await Credencial.create({
                    identificador,
                    fechaAlta: fechaLicencia.toISOString().split('T')[0],
                    fechaVencimiento: fechaLicenciaBaja.toISOString().split('T')[0],
                    estado: 'ACTIVO',
                    idPersona: persona.idPersona
                }, { transaction });
            }
            
            await transaction.commit();
            
            const personaActualizada = await Persona.findByPk(req.params.id, {
                include: [
                    {
                        model: Club,
                        as: 'club',
                        attributes: ['idClub', 'nombre']
                    },
                    {
                        model: Credencial,
                        as: 'credenciales'
                    }
                ]
            });
            
            res.status(200).json({
                status: "1",
                msg: "Licencia y credencial renovadas exitosamente.",
                persona: personaActualizada
            });
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    } catch (error) {
        console.error("Error en renovarLicencia:", error);
        res.status(500).json({
            status: "0",
            msg: "Error procesando la operación.",
            error: error.message
        });
    }
};

personaCtrl.actualizarEstadoLicencias = async (req, res) => {
    /*
    #swagger.tags = ['Personas']
    #swagger.summary = 'Actualizar estado de licencias'
    #swagger.description = 'Verifica todas las licencias y actualiza su estado según la fecha de vencimiento.'
    */
    try {
        const fechaActual = new Date().toISOString().split('T')[0];
        
        const personas = await Persona.findAll({
            where: {
                fechaLicencia: { [Op.not]: null }
            }
        });
        
        let actualizadas = 0;
        
        const transaction = await sequelize.transaction();
        
        try {
            for (const persona of personas) {
                if (persona.fechaLicenciaBaja) {
                    const nuevoEstado = persona.fechaLicenciaBaja >= fechaActual ? 'ACTIVO' : 'INACTIVO';
                    
                    if (persona.estadoLicencia !== nuevoEstado) {
                        await persona.update({ 
                            estadoLicencia: nuevoEstado 
                        }, { transaction });
                        actualizadas++;
                        
                        const credenciales = await Credencial.findAll({
                            where: { idPersona: persona.idPersona }
                        });
                        
                        if (credenciales.length > 0) {
                            for (const credencial of credenciales) {
                                if (credencial.estado !== nuevoEstado) {
                                    await credencial.update({ 
                                        estado: nuevoEstado 
                                    }, { transaction });
                                }
                            }
                        }
                    }
                }
            }
            
            await transaction.commit();
            
            res.status(200).json({
                status: "1",
                msg: `Se actualizó el estado de ${actualizadas} licencias.`,
                totalPersonas: personas.length,
                licenciasActualizadas: actualizadas
            });
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    } catch (error) {
        console.error("Error en actualizarEstadoLicencias:", error);
        res.status(500).json({
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
    #swagger.description = 'Elimina una persona de la base de datos y su foto de ImgBB si existe.'
    */
    try {
        const persona = await Persona.findByPk(req.params.id);
        
        if (!persona) {
            return res.status(404).json({
                status: "0",
                msg: "Persona no encontrada para eliminar."
            });
        }
        
        if (persona.fotoPerfilDeleteUrl) {
            try {
                await imgbbService.deleteImage(persona.fotoPerfilDeleteUrl);
                console.log('Imagen eliminada de ImgBB');
            } catch (deleteError) {
                console.error('Error eliminando imagen de ImgBB:', deleteError);
            }
        }
        
        await persona.destroy();

        res.status(200).json({
            status: "1",
            msg: "Persona eliminada exitosamente."
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
    #swagger.parameters['estadoLicencia'] = { in: 'query', description: 'Filtra por estado de licencia (ACTIVO/INACTIVO).', type: 'string' }
    #swagger.parameters['fechaLicenciaBajaDesde'] = { in: 'query', description: 'Filtra por fecha de baja de licencia desde (YYYY-MM-DD).', type: 'string' }
    #swagger.parameters['fechaLicenciaBajaHasta'] = { in: 'query', description: 'Filtra por fecha de baja de licencia hasta (YYYY-MM-DD).', type: 'string' }
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

    if (query.estadoLicencia) {
        criteria.estadoLicencia = query.estadoLicencia;
    }

    if (query.fechaLicenciaBajaDesde || query.fechaLicenciaBajaHasta) {
        criteria.fechaLicenciaBaja = {};
        if (query.fechaLicenciaBajaDesde) {
            criteria.fechaLicenciaBaja[Op.gte] = query.fechaLicenciaBajaDesde;
        }
        if (query.fechaLicenciaBajaHasta) {
            criteria.fechaLicenciaBaja[Op.lte] = query.fechaLicenciaBajaHasta;
        }
    }

    try {
        const personas = await Persona.findAll({
            where: criteria,
            include: [
                {
                    model: Club,
                    as: 'club',
                    attributes: ['idClub', 'nombre']
                },
                {
                    model: Credencial,
                    as: 'credenciales'
                }
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

// Nuevo endpoint para obtener solo la foto de perfil
personaCtrl.getFotoPerfil = async (req, res) => {
    /*
    #swagger.tags = ['Personas']
    #swagger.summary = 'Obtener foto de perfil de una Persona'
    #swagger.description = 'Retorna la URL de la foto de perfil de una persona en ImgBB.'
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
                fotoPerfilUrl: persona.fotoPerfil,
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

// Endpoint para eliminar foto de perfil
personaCtrl.deleteFotoPerfil = async (req, res) => {
    /*
    #swagger.tags = ['Personas']
    #swagger.summary = 'Eliminar foto de perfil de una Persona'
    #swagger.description = 'Elimina la foto de perfil de una persona tanto de la base de datos como de ImgBB.'
    */
    try {
        const persona = await Persona.findByPk(req.params.id);

        if (!persona) {
            return res.status(404).json({
                status: "0",
                msg: "Persona no encontrada."
            });
        }
        
        if (persona.fotoPerfilDeleteUrl) {
            try {
                await imgbbService.deleteImage(persona.fotoPerfilDeleteUrl);
                console.log('Imagen eliminada de ImgBB');
            } catch (deleteError) {
                console.error('Error eliminando imagen de ImgBB:', deleteError);
            }
        }

        await persona.update({
            fotoPerfil: null,
            fotoPerfilDeleteUrl: null,
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