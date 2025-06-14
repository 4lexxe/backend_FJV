const Club = require("../models/Club");
const Persona = require("../models/Persona");
const Equipo = require("../models/Equipo");
const { Op } = require('sequelize');

const clubCtrl = {};

clubCtrl.getClubs = async (req, res) => {
    /*
    #swagger.tags = ['Clubes']
    #swagger.summary = 'Obtener todos los Clubes'
    #swagger.description = 'Retorna una lista de todos los clubes registrados, incluyendo sus personas y equipos asociados.'
    */
    try {
        const clubs = await Club.findAll({
            include: [
                {
                    model: Persona,
                    as: 'personas', 
                    attributes: ['idPersona', 'nombreApellido', 'dni', 'tipo'] 
                },
                {
                    model: Equipo,
                    as: 'equipos', 
                    attributes: ['idEquipo', 'nombre', 'nombreDelegado']
                }
            ],
            order: [['nombre', 'ASC']] // Ordenar por nombre alfabéticamente
        });
        res.status(200).json(clubs);
    } catch (error) {
        console.error("Error en getClubs:", error);
        res.status(500).json({
            status: "0",
            msg: "Error procesando la operación.",
            error: error.message
        });
    }
};

clubCtrl.createClub = async (req, res) => {
    /*
    #swagger.tags = ['Clubes']
    #swagger.summary = 'Crear un nuevo Club'
    #swagger.description = 'Agrega un nuevo club a la base de datos. Solo accesible para administradores.'
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.parameters['body'] = {
        in: 'body',
        description: 'Datos del club a crear.',
        required: true,
        schema: { $ref: '#/definitions/Club' }
    }
    */
    try {
        // Validaciones de datos
        const { nombre, direccion, telefono, email, cuit, fechaAfiliacion, estadoAfiliacion } = req.body;
        
        // Validar campos obligatorios
        if (!nombre || nombre.trim() === '') {
            return res.status(400).json({
                status: "0",
                msg: "El nombre del club es obligatorio"
            });
        }
        
        if (!direccion || direccion.trim() === '') {
            return res.status(400).json({
                status: "0",
                msg: "La dirección del club es obligatoria"
            });
        }
        
        if (!email || !isValidEmail(email)) {
            return res.status(400).json({
                status: "0",
                msg: "El email del club debe ser válido"
            });
        }
        
        if (!cuit || !isValidCUIT(cuit)) {
            return res.status(400).json({
                status: "0",
                msg: "El CUIT del club debe tener un formato válido (XX-XXXXXXXX-X)"
            });
        }
        
        if (!fechaAfiliacion) {
            return res.status(400).json({
                status: "0",
                msg: "La fecha de afiliación es obligatoria"
            });
        }
        
        if (!estadoAfiliacion || !['Activo', 'Inactivo', 'Suspendido'].includes(estadoAfiliacion)) {
            return res.status(400).json({
                status: "0",
                msg: "El estado de afiliación debe ser: Activo, Inactivo o Suspendido"
            });
        }
        
        // Verificar si ya existe un club con el mismo nombre
        const clubExistente = await Club.findOne({ 
            where: { nombre: { [Op.iLike]: nombre } } 
        });
        
        if (clubExistente) {
            return res.status(409).json({
                status: "0",
                msg: `Ya existe un club con el nombre '${nombre}'`
            });
        }
        
        // Verificar si ya existe un club con el mismo CUIT
        const cuitExistente = await Club.findOne({ where: { cuit } });
        if (cuitExistente) {
            return res.status(409).json({
                status: "0",
                msg: `Ya existe un club con el CUIT '${cuit}'`
            });
        }
        
        // Verificar si ya existe un club con el mismo email
        const emailExistente = await Club.findOne({ where: { email } });
        if (emailExistente) {
            return res.status(409).json({
                status: "0",
                msg: `Ya existe un club con el email '${email}'`
            });
        }

        const club = await Club.create(req.body);
        res.status(201).json({
            status: "1",
            msg: "Club creado exitosamente",
            club: club
        });
    } catch (error) {
        console.error("Error en createClub:", error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            const field = error.errors[0]?.path || 'Un campo';
            return res.status(409).json({
                status: "0",
                msg: `${field} ya está registrado para otro club`,
                error: error.message
            });
        }
        res.status(500).json({
            status: "0",
            msg: "Error al procesar la operación",
            error: error.message
        });
    }
};

clubCtrl.getClub = async (req, res) => {
    /*
    #swagger.tags = ['Clubes']
    #swagger.summary = 'Obtener Club por ID'
    #swagger.description = 'Retorna un club específico usando su ID, incluyendo sus personas y equipos asociados.'
    */
    try {
        const club = await Club.findByPk(req.params.id, {
            include: [
                {
                    model: Persona,
                    as: 'personas',
                    attributes: ['idPersona', 'nombreApellido', 'dni', 'tipo'] 
                },
                {
                    model: Equipo,
                    as: 'equipos',
                    attributes: ['idEquipo', 'nombre', 'nombreDelegado']
                }
            ]
        });

        if (!club) {
            return res.status(404).json({
                status: "0",
                msg: "Club no encontrado"
            });
        }
        res.status(200).json(club);
    } catch (error) {
        console.error("Error en getClub:", error);
        res.status(500).json({
            status: "0",
            msg: "Error procesando la operación",
            error: error.message
        });
    }
};

clubCtrl.editClub = async (req, res) => {
    /*
    #swagger.tags = ['Clubes']
    #swagger.summary = 'Actualizar un Club'
    #swagger.description = 'Actualiza la información de un club existente usando su ID. Solo accesible para administradores.'
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.parameters['body'] = {
        in: 'body',
        description: 'Datos del club a actualizar.',
        required: true,
        schema: { $ref: '#/definitions/Club' }
    }
    */
    try {
        // Validaciones de entrada
        const { nombre, email, cuit } = req.body;
        
        // Verificar si el club existe
        const clubExistente = await Club.findByPk(req.params.id);
        if (!clubExistente) {
            return res.status(404).json({
                status: "0",
                msg: "Club no encontrado para actualizar"
            });
        }

        // Validar nombre único si se cambia
        if (nombre && nombre !== clubExistente.nombre) {
            const nombreExistente = await Club.findOne({
                where: {
                    nombre: { [Op.iLike]: nombre },
                    idClub: { [Op.ne]: req.params.id }
                }
            });
            
            if (nombreExistente) {
                return res.status(409).json({
                    status: "0",
                    msg: `Ya existe un club con el nombre '${nombre}'`
                });
            }
        }
        
        // Validar email único si se cambia
        if (email && email !== clubExistente.email) {
            if (!isValidEmail(email)) {
                return res.status(400).json({
                    status: "0",
                    msg: "El formato del email no es válido"
                });
            }
            
            const emailExistente = await Club.findOne({
                where: {
                    email: email,
                    idClub: { [Op.ne]: req.params.id }
                }
            });
            
            if (emailExistente) {
                return res.status(409).json({
                    status: "0",
                    msg: `Ya existe un club con el email '${email}'`
                });
            }
        }
        
        // Validar CUIT único si se cambia
        if (cuit && cuit !== clubExistente.cuit) {
            if (!isValidCUIT(cuit)) {
                return res.status(400).json({
                    status: "0",
                    msg: "El formato del CUIT no es válido (XX-XXXXXXXX-X)"
                });
            }
            
            const cuitExistente = await Club.findOne({
                where: {
                    cuit: cuit,
                    idClub: { [Op.ne]: req.params.id }
                }
            });
            
            if (cuitExistente) {
                return res.status(409).json({
                    status: "0",
                    msg: `Ya existe un club con el CUIT '${cuit}'`
                });
            }
        }

        // Actualizar el club
        await clubExistente.update(req.body);
        
        res.status(200).json({
            status: "1",
            msg: "Club actualizado exitosamente",
            club: clubExistente
        });
    } catch (error) {
        console.error("Error en editClub:", error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            const field = error.errors[0]?.path || 'Un campo';
            return res.status(409).json({
                status: "0",
                msg: `${field} ya está registrado para otro club`,
                error: error.message
            });
        }
        res.status(500).json({
            status: "0",
            msg: "Error procesando la operación",
            error: error.message
        });
    }
};

clubCtrl.deleteClub = async (req, res) => {
    /*
    #swagger.tags = ['Clubes']
    #swagger.summary = 'Eliminar un Club'
    #swagger.description = 'Elimina un club de la base de datos usando su ID. Solo accesible para administradores.'
    #swagger.security = [{ "bearerAuth": [] }]
    */
    try {
        // Verificar si hay personas asociadas al club
        const personasAsociadas = await Persona.count({ 
            where: { idClub: req.params.id } 
        });
        
        if (personasAsociadas > 0) {
            return res.status(400).json({
                status: "0",
                msg: `No se puede eliminar el club porque tiene ${personasAsociadas} persona(s) asociada(s). Reasigne las personas antes de eliminar el club.`
            });
        }
        
        // Verificar si hay equipos asociados al club
        const equiposAsociados = await Equipo.count({
            where: { idClub: req.params.id }
        });
        
        if (equiposAsociados > 0) {
            return res.status(400).json({
                status: "0",
                msg: `No se puede eliminar el club porque tiene ${equiposAsociados} equipo(s) asociado(s). Elimine los equipos antes de eliminar el club.`
            });
        }

        // Eliminar el club
        const deletedRows = await Club.destroy({
            where: { idClub: req.params.id }
        });

        if (deletedRows === 0) {
            return res.status(404).json({
                status: "0",
                msg: "Club no encontrado para eliminar"
            });
        }

        res.status(200).json({
            status: "1",
            msg: "Club eliminado exitosamente"
        });
    } catch (error) {
        console.error("Error en deleteClub:", error);
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(400).json({
                status: "0",
                msg: "No se puede eliminar el club porque está asociado a otros registros",
                error: error.message
            });
        }
        res.status(500).json({
            status: "0",
            msg: "Error procesando la operación",
            error: error.message
        });
    }
};

clubCtrl.getClubFiltro = async (req, res) => {
    /*
    #swagger.tags = ['Clubes']
    #swagger.summary = 'Filtrar Clubes'
    #swagger.description = 'Retorna clubes que coinciden con los criterios de filtro (nombre, cuit, estadoAfiliacion, fechaAfiliacionDesde, fechaAfiliacionHasta).'
    #swagger.parameters['nombre'] = { in: 'query', description: 'Filtra por nombre del club.', type: 'string' }
    #swagger.parameters['cuit'] = { in: 'query', description: 'Filtra por CUIT del club.', type: 'string' }
    #swagger.parameters['estadoAfiliacion'] = { in: 'query', description: 'Filtra por estado de afiliación.', type: 'string' }
    #swagger.parameters['fechaAfiliacionDesde'] = { in: 'query', description: 'Filtra por fecha de afiliación desde (YYYY-MM-DD).', type: 'string' }
    #swagger.parameters['fechaAfiliacionHasta'] = { in: 'query', description: 'Filtra por fecha de afiliación hasta (YYYY-MM-DD).', type: 'string' }
    */
    const query = req.query;
    const criteria = {};

    if (query.nombre) {
        criteria.nombre = { [Op.iLike]: `%${query.nombre}%` };
    }
    if (query.cuit) {
        criteria.cuit = { [Op.iLike]: `%${query.cuit}%` };
    }
    if (query.estadoAfiliacion) {
        criteria.estadoAfiliacion = { [Op.iLike]: `%${query.estadoAfiliacion}%` };
    }

    // Filtro por rango de fechas de afiliación
    if (query.fechaAfiliacionDesde || query.fechaAfiliacionHasta) {
        criteria.fechaAfiliacion = {};
        if (query.fechaAfiliacionDesde) {
            criteria.fechaAfiliacion[Op.gte] = query.fechaAfiliacionDesde;
        }
        if (query.fechaAfiliacionHasta) {
            criteria.fechaAfiliacion[Op.lte] = query.fechaAfiliacionHasta;
        }
    }

    try {
        const clubs = await Club.findAll({
            where: criteria,
            include: [
                { 
                    model: Persona, 
                    as: 'personas', 
                    attributes: ['idPersona', 'nombreApellido'] 
                },
                { 
                    model: Equipo, 
                    as: 'equipos', 
                    attributes: ['idEquipo', 'nombre'] 
                }
            ],
            order: [['nombre', 'ASC']]
        });
        
        res.status(200).json(clubs);
    } catch (error) {
        console.error("Error en getClubFiltro:", error);
        res.status(500).json({
            status: "0",
            msg: "Error procesando la operación",
            error: error.message
        });
    }
};

// Funciones auxiliares de validación

/**
 * Valida el formato de un email
 * @param {string} email Email a validar
 * @returns {boolean} true si el email es válido
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Valida el formato de un CUIT argentino (XX-XXXXXXXX-X)
 * @param {string} cuit CUIT a validar
 * @returns {boolean} true si el CUIT tiene un formato válido
 */
function isValidCUIT(cuit) {
    // Validación básica de formato XX-XXXXXXXX-X
    const cuitRegex = /^\d{2}-\d{8}-\d{1}$/;
    
    // También aceptar formato sin guiones
    const cuitNoGuionesRegex = /^\d{11}$/;
    
    return cuitRegex.test(cuit) || cuitNoGuionesRegex.test(cuit);
}

module.exports = clubCtrl;