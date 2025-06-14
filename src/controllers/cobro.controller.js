const Cobro = require("../models/Cobro");
const Club = require("../models/Club");
const Equipo = require("../models/Equipo");
const { Op } = require('sequelize');

const cobroCtrl = {};

// Obtener todos los cobros
cobroCtrl.getCobros = async (req, res) => {
    /*
    #swagger.tags = ['Cobros']
    #swagger.summary = 'Obtener todos los Cobros'
    #swagger.description = 'Retorna una lista de todos los cobros registrados, incluyendo información del club y equipo asociados.'
    */
    try {
        const cobros = await Cobro.findAll({
            include: [
                {
                    model: Club,
                    as: 'club', 
                    attributes: ['idClub', 'nombre']
                },
                {
                    model: Equipo,
                    as: 'equipo',
                    attributes: ['idEquipo', 'nombre']
                }
            ],
            order: [['fechaCobro', 'DESC']]
        });
        res.status(200).json(cobros);
    } catch (error) {
        console.error("Error en getCobros:", error);
        res.status(500).json({
            status: "0",
            msg: "Error procesando la operación.",
            error: error.message
        });
    }
};

// Crear un nuevo cobro
cobroCtrl.createCobro = async (req, res) => {
    /*
    #swagger.tags = ['Cobros']
    #swagger.summary = 'Crear un nuevo Cobro'
    #swagger.description = 'Registra un nuevo cobro asociado a un club y opcionalmente a un equipo.'
    #swagger.parameters['body'] = {
        in: 'body',
        description: 'Datos del cobro a crear.',
        required: true,
        schema: { $ref: '#/definitions/Cobro' }
    }
    */
    try {
        // Validaciones básicas
        const { concepto, monto, idClub, idEquipo } = req.body;
        
        if (!concepto || concepto.trim() === '') {
            return res.status(400).json({
                status: "0",
                msg: "El concepto del cobro es obligatorio"
            });
        }
        
        if (!monto || monto <= 0) {
            return res.status(400).json({
                status: "0",
                msg: "El monto debe ser mayor que cero"
            });
        }
        
        if (!idClub) {
            return res.status(400).json({
                status: "0",
                msg: "Debe especificar el club al que se realiza el cobro"
            });
        }
        
        // Verificar que el club exista
        const clubExistente = await Club.findByPk(idClub);
        if (!clubExistente) {
            return res.status(400).json({
                status: "0",
                msg: `El Club con ID ${idClub} no existe`
            });
        }
        
        // Verificar que el equipo exista si se proporciona
        if (idEquipo) {
            const equipoExistente = await Equipo.findByPk(idEquipo);
            if (!equipoExistente) {
                return res.status(400).json({
                    status: "0",
                    msg: `El Equipo con ID ${idEquipo} no existe`
                });
            }
            
            // Verificar que el equipo pertenezca al club
            if (equipoExistente.idClub !== parseInt(idClub)) {
                return res.status(400).json({
                    status: "0",
                    msg: `El Equipo con ID ${idEquipo} no pertenece al Club con ID ${idClub}`
                });
            }
        }
        
        // Crear el cobro
        const cobro = await Cobro.create(req.body);
        
        res.status(201).json({
            status: "1",
            msg: "Cobro registrado exitosamente",
            cobro: cobro
        });
    } catch (error) {
        console.error("Error en createCobro:", error);
        res.status(500).json({
            status: "0",
            msg: "Error procesando la operación",
            error: error.message
        });
    }
};

// Obtener cobro por ID
cobroCtrl.getCobro = async (req, res) => {
    /*
    #swagger.tags = ['Cobros']
    #swagger.summary = 'Obtener Cobro por ID'
    #swagger.description = 'Retorna un cobro específico usando su ID, incluyendo información del club y equipo asociados.'
    */
    try {
        const cobro = await Cobro.findByPk(req.params.id, {
            include: [
                {
                    model: Club,
                    as: 'club',
                    attributes: ['idClub', 'nombre']
                },
                {
                    model: Equipo,
                    as: 'equipo',
                    attributes: ['idEquipo', 'nombre']
                }
            ]
        });

        if (!cobro) {
            return res.status(404).json({
                status: "0",
                msg: "Cobro no encontrado"
            });
        }
        
        res.status(200).json(cobro);
    } catch (error) {
        console.error("Error en getCobro:", error);
        res.status(500).json({
            status: "0",
            msg: "Error procesando la operación",
            error: error.message
        });
    }
};

// Actualizar cobro
cobroCtrl.updateCobro = async (req, res) => {
    /*
    #swagger.tags = ['Cobros']
    #swagger.summary = 'Actualizar un Cobro'
    #swagger.description = 'Actualiza la información de un cobro existente usando su ID.'
    #swagger.parameters['body'] = {
        in: 'body',
        description: 'Datos del cobro a actualizar.',
        required: true,
        schema: { $ref: '#/definitions/Cobro' }
    }
    */
    try {
        // Validar que el cobro exista
        const cobroExistente = await Cobro.findByPk(req.params.id);
        if (!cobroExistente) {
            return res.status(404).json({
                status: "0",
                msg: "Cobro no encontrado para actualizar"
            });
        }
        
        // Validaciones si se está cambiando el club o equipo
        if (req.body.idClub && req.body.idClub !== cobroExistente.idClub) {
            const clubExistente = await Club.findByPk(req.body.idClub);
            if (!clubExistente) {
                return res.status(400).json({
                    status: "0",
                    msg: `El Club con ID ${req.body.idClub} no existe`
                });
            }
        }
        
        if (req.body.idEquipo && req.body.idEquipo !== cobroExistente.idEquipo) {
            const equipoExistente = await Equipo.findByPk(req.body.idEquipo);
            if (!equipoExistente) {
                return res.status(400).json({
                    status: "0",
                    msg: `El Equipo con ID ${req.body.idEquipo} no existe`
                });
            }
            
            // Verificar que el equipo pertenezca al club (si no se está cambiando el club)
            const idClub = req.body.idClub || cobroExistente.idClub;
            if (equipoExistente.idClub !== parseInt(idClub)) {
                return res.status(400).json({
                    status: "0",
                    msg: `El Equipo con ID ${req.body.idEquipo} no pertenece al Club con ID ${idClub}`
                });
            }
        }
        
        // Actualizar el cobro
        await cobroExistente.update(req.body);
        
        res.status(200).json({
            status: "1",
            msg: "Cobro actualizado exitosamente",
            cobro: cobroExistente
        });
    } catch (error) {
        console.error("Error en updateCobro:", error);
        res.status(500).json({
            status: "0",
            msg: "Error procesando la operación",
            error: error.message
        });
    }
};

// Eliminar cobro
cobroCtrl.deleteCobro = async (req, res) => {
    /*
    #swagger.tags = ['Cobros']
    #swagger.summary = 'Eliminar un Cobro'
    #swagger.description = 'Elimina un cobro de la base de datos usando su ID.'
    */
    try {
        const deletedRows = await Cobro.destroy({
            where: { idCobro: req.params.id }
        });

        if (deletedRows === 0) {
            return res.status(404).json({
                status: "0",
                msg: "Cobro no encontrado para eliminar"
            });
        }

        res.status(200).json({
            status: "1",
            msg: "Cobro eliminado exitosamente"
        });
    } catch (error) {
        console.error("Error en deleteCobro:", error);
        res.status(500).json({
            status: "0",
            msg: "Error procesando la operación",
            error: error.message
        });
    }
};

// Filtrar cobros por varios criterios
cobroCtrl.getCobrosFilter = async (req, res) => {
    /*
    #swagger.tags = ['Cobros']
    #swagger.summary = 'Filtrar Cobros'
    #swagger.description = 'Retorna cobros que coinciden con los criterios de filtro (idClub, idEquipo, estado, fechaDesde, fechaHasta).'
    #swagger.parameters['idClub'] = { in: 'query', description: 'ID del club asociado.', type: 'integer' }
    #swagger.parameters['idEquipo'] = { in: 'query', description: 'ID del equipo asociado.', type: 'integer' }
    #swagger.parameters['estado'] = { in: 'query', description: 'Estado del cobro (Pendiente, Pagado, Vencido, Anulado).', type: 'string' }
    #swagger.parameters['fechaDesde'] = { in: 'query', description: 'Fecha desde (YYYY-MM-DD).', type: 'string' }
    #swagger.parameters['fechaHasta'] = { in: 'query', description: 'Fecha hasta (YYYY-MM-DD).', type: 'string' }
    */
    const { idClub, idEquipo, estado, fechaDesde, fechaHasta } = req.query;
    const criteria = {};

    // Aplicar filtros si se proporcionan
    if (idClub) {
        criteria.idClub = idClub;
    }
    
    if (idEquipo) {
        criteria.idEquipo = idEquipo;
    }
    
    if (estado) {
        criteria.estado = estado;
    }
    
    // Filtro por rango de fechas
    if (fechaDesde || fechaHasta) {
        criteria.fechaCobro = {};
        if (fechaDesde) {
            criteria.fechaCobro[Op.gte] = fechaDesde;
        }
        if (fechaHasta) {
            criteria.fechaCobro[Op.lte] = fechaHasta;
        }
    }

    try {
        const cobros = await Cobro.findAll({
            where: criteria,
            include: [
                {
                    model: Club,
                    as: 'club',
                    attributes: ['idClub', 'nombre']
                },
                {
                    model: Equipo,
                    as: 'equipo',
                    attributes: ['idEquipo', 'nombre']
                }
            ],
            order: [['fechaCobro', 'DESC']]
        });
        
        res.status(200).json(cobros);
    } catch (error) {
        console.error("Error en getCobrosFilter:", error);
        res.status(500).json({
            status: "0",
            msg: "Error procesando la operación",
            error: error.message
        });
    }
};

// Obtener cobros por club específico
cobroCtrl.getCobrosByClub = async (req, res) => {
    /*
    #swagger.tags = ['Cobros']
    #swagger.summary = 'Obtener Cobros por Club'
    #swagger.description = 'Retorna todos los cobros asociados a un club específico.'
    */
    try {
        const idClub = req.params.idClub;
        
        // Verificar que el club exista
        const clubExistente = await Club.findByPk(idClub);
        if (!clubExistente) {
            return res.status(404).json({
                status: "0",
                msg: `El Club con ID ${idClub} no existe`
            });
        }
        
        const cobros = await Cobro.findAll({
            where: { idClub },
            include: [
                {
                    model: Club,
                    as: 'club',
                    attributes: ['idClub', 'nombre']
                },
                {
                    model: Equipo,
                    as: 'equipo',
                    attributes: ['idEquipo', 'nombre']
                }
            ],
            order: [['fechaCobro', 'DESC']]
        });
        
        res.status(200).json(cobros);
    } catch (error) {
        console.error("Error en getCobrosByClub:", error);
        res.status(500).json({
            status: "0",
            msg: "Error procesando la operación",
            error: error.message
        });
    }
};

// Obtener cobros por equipo específico
cobroCtrl.getCobrosByEquipo = async (req, res) => {
    /*
    #swagger.tags = ['Cobros']
    #swagger.summary = 'Obtener Cobros por Equipo'
    #swagger.description = 'Retorna todos los cobros asociados a un equipo específico.'
    */
    try {
        const idEquipo = req.params.idEquipo;
        
        // Verificar que el equipo exista
        const equipoExistente = await Equipo.findByPk(idEquipo);
        if (!equipoExistente) {
            return res.status(404).json({
                status: "0",
                msg: `El Equipo con ID ${idEquipo} no existe`
            });
        }
        
        const cobros = await Cobro.findAll({
            where: { idEquipo },
            include: [
                {
                    model: Club,
                    as: 'club',
                    attributes: ['idClub', 'nombre']
                },
                {
                    model: Equipo,
                    as: 'equipo',
                    attributes: ['idEquipo', 'nombre']
                }
            ],
            order: [['fechaCobro', 'DESC']]
        });
        
        res.status(200).json(cobros);
    } catch (error) {
        console.error("Error en getCobrosByEquipo:", error);
        res.status(500).json({
            status: "0",
            msg: "Error procesando la operación",
            error: error.message
        });
    }
};

// Cambiar estado de un cobro (ej: a 'Pagado')
cobroCtrl.cambiarEstadoCobro = async (req, res) => {
    /*
    #swagger.tags = ['Cobros']
    #swagger.summary = 'Cambiar Estado de un Cobro'
    #swagger.description = 'Actualiza el estado de un cobro existente (ej: a "Pagado", "Vencido", "Anulado").'
    #swagger.parameters['body'] = {
        in: 'body',
        description: 'Datos para actualizar el estado del cobro.',
        required: true,
        schema: { 
            estado: 'string',
            comprobantePago: 'string',
            observaciones: 'string'
        }
    }
    */
    try {
        const { estado, comprobantePago, observaciones } = req.body;
        
        if (!estado || !['Pendiente', 'Pagado', 'Vencido', 'Anulado'].includes(estado)) {
            return res.status(400).json({
                status: "0",
                msg: "El estado debe ser 'Pendiente', 'Pagado', 'Vencido' o 'Anulado'"
            });
        }
        
        // Encontrar el cobro
        const cobro = await Cobro.findByPk(req.params.id);
        if (!cobro) {
            return res.status(404).json({
                status: "0",
                msg: "Cobro no encontrado"
            });
        }
        
        // Actualizar el estado y otros campos relacionados
        cobro.estado = estado;
        if (comprobantePago !== undefined) cobro.comprobantePago = comprobantePago;
        if (observaciones !== undefined) cobro.observaciones = observaciones;
        
        await cobro.save();
        
        res.status(200).json({
            status: "1",
            msg: `Estado del cobro actualizado a '${estado}'`,
            cobro: cobro
        });
    } catch (error) {
        console.error("Error en cambiarEstadoCobro:", error);
        res.status(500).json({
            status: "0",
            msg: "Error procesando la operación",
            error: error.message
        });
    }
};

module.exports = cobroCtrl;
