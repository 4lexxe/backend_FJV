const Equipo = require("../models/Equipo");
const Club = require("../models/Club");
const Categoria = require("../models/Categoria");
const { Op } = require('sequelize');

const equipoCtrl = {};

equipoCtrl.getEquipos = async (req, res) => {
    /*
    #swagger.tags = ['Equipos']
    #swagger.summary = 'Obtener todos los Equipos'
    #swagger.description = 'Retorna una lista de todos los equipos registrados, incluyendo la información de su club y categoría asociados.'
    */
    try {
        const equipos = await Equipo.findAll({
            include: [
                {
                    model: Club,
                    as: 'club', 
                    attributes: ['idClub', 'nombre', 'email']
                },
                {
                    model: Categoria,
                    as: 'categoria', 
                    attributes: ['idCategoria', 'nombre', 'edadMinima', 'edadMaxima']
                }
            ],
            order: [['nombre', 'ASC']] // Ordenar alfabéticamente por nombre
        });
        res.status(200).json(equipos);
    } catch (error) {
        console.error("Error en getEquipos:", error);
        res.status(500).json({
            status: "0",
            msg: "Error procesando la operación.",
            error: error.message
        });
    }
};

equipoCtrl.createEquipo = async (req, res) => {
    /*
    #swagger.tags = ['Equipos']
    #swagger.summary = 'Crear un nuevo Equipo'
    #swagger.description = 'Agrega un nuevo equipo a la base de datos. Solo accesible para administradores.'
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.parameters['body'] = {
        in: 'body',
        description: 'Datos del equipo a crear.',
        required: true,
        schema: { $ref: '#/definitions/Equipo' }
    }
    */
    try {
        // Validaciones de datos
        const { nombre, idClub, idCategoria, nombreDelegado } = req.body;
        
        // Validar campos obligatorios
        if (!nombre || nombre.trim() === '') {
            return res.status(400).json({
                status: "0",
                msg: "El nombre del equipo es obligatorio"
            });
        }
        
        if (!idClub) {
            return res.status(400).json({
                status: "0",
                msg: "El club asociado es obligatorio"
            });
        }

        if (!idCategoria) {
            return res.status(400).json({
                status: "0",
                msg: "La categoría asociada es obligatoria"
            });
        }

        // Validar que el Club exista
        const clubExistente = await Club.findByPk(idClub);
        if (!clubExistente) {
            return res.status(400).json({
                status: "0",
                msg: `El Club con ID ${idClub} no existe`
            });
        }
        
        // Validar que la Categoría exista
        const categoriaExistente = await Categoria.findByPk(idCategoria);
        if (!categoriaExistente) {
            return res.status(400).json({
                status: "0",
                msg: `La Categoría con ID ${idCategoria} no existe`
            });
        }

        // Verificar si ya existe un equipo con el mismo nombre en el mismo club y categoría
        const equipoExistente = await Equipo.findOne({ 
            where: { 
                nombre: { [Op.iLike]: nombre },
                idClub: idClub,
                idCategoria: idCategoria
            } 
        });
        
        if (equipoExistente) {
            return res.status(409).json({
                status: "0",
                msg: `Ya existe un equipo con el nombre '${nombre}' en este club y categoría`
            });
        }

        const equipo = await Equipo.create(req.body);
        
        res.status(201).json({
            status: "1",
            msg: "Equipo creado exitosamente",
            equipo: equipo
        });
    } catch (error) {
        console.error("Error en createEquipo:", error);
        res.status(500).json({
            status: "0",
            msg: "Error al procesar la operación",
            error: error.message
        });
    }
};

equipoCtrl.getEquipo = async (req, res) => {
    /*
    #swagger.tags = ['Equipos']
    #swagger.summary = 'Obtener Equipo por ID'
    #swagger.description = 'Retorna un equipo específico usando su ID, incluyendo la información de su club y categoría asociados.'
    */
    try {
        const equipo = await Equipo.findByPk(req.params.id, {
            include: [
                {
                    model: Club,
                    as: 'club',
                    attributes: ['idClub', 'nombre', 'email']
                },
                {
                    model: Categoria,
                    as: 'categoria',
                    attributes: ['idCategoria', 'nombre', 'edadMinima', 'edadMaxima']
                }
            ]
        });

        if (!equipo) {
            return res.status(404).json({
                status: "0",
                msg: "Equipo no encontrado"
            });
        }
        
        res.status(200).json(equipo);
    } catch (error) {
        console.error("Error en getEquipo:", error);
        res.status(500).json({
            status: "0",
            msg: "Error procesando la operación",
            error: error.message
        });
    }
};

equipoCtrl.editEquipo = async (req, res) => {
    /*
    #swagger.tags = ['Equipos']
    #swagger.summary = 'Actualizar un Equipo'
    #swagger.description = 'Actualiza la información de un equipo existente usando su ID. Solo accesible para administradores.'
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.parameters['body'] = {
        in: 'body',
        description: 'Datos del equipo a actualizar.',
        required: true,
        schema: { $ref: '#/definitions/Equipo' }
    }
    */
    try {
        // Extracción y validación de datos
        const { nombre, idClub, idCategoria } = req.body;
        
        // Verificar si existe el equipo que queremos actualizar
        const equipoExistente = await Equipo.findByPk(req.params.id);
        if (!equipoExistente) {
            return res.status(404).json({
                status: "0",
                msg: "Equipo no encontrado para actualizar"
            });
        }

        // Validar Club si se proporciona
        if (idClub) {
            const clubExistente = await Club.findByPk(idClub);
            if (!clubExistente) {
                return res.status(400).json({
                    status: "0",
                    msg: `El Club con ID ${idClub} no existe`
                });
            }
        }

        // Validar Categoría si se proporciona
        if (idCategoria) {
            const categoriaExistente = await Categoria.findByPk(idCategoria);
            if (!categoriaExistente) {
                return res.status(400).json({
                    status: "0",
                    msg: `La Categoría con ID ${idCategoria} no existe`
                });
            }
        }

        // Si se cambia el nombre, verificar unicidad en el contexto (club y categoría)
        if (nombre && 
            (nombre !== equipoExistente.nombre || 
             idClub !== equipoExistente.idClub || 
             idCategoria !== equipoExistente.idCategoria)) {
                
            const equipoConMismoNombre = await Equipo.findOne({
                where: {
                    nombre: { [Op.iLike]: nombre },
                    idClub: idClub || equipoExistente.idClub,
                    idCategoria: idCategoria || equipoExistente.idCategoria,
                    idEquipo: { [Op.ne]: req.params.id }
                }
            });
            
            if (equipoConMismoNombre) {
                return res.status(409).json({
                    status: "0",
                    msg: `Ya existe un equipo con el nombre '${nombre}' en este club y categoría`
                });
            }
        }

        // Actualizar equipo
        await equipoExistente.update(req.body);
        
        res.status(200).json({
            status: "1",
            msg: "Equipo actualizado exitosamente",
            equipo: equipoExistente
        });
    } catch (error) {
        console.error("Error en editEquipo:", error);
        res.status(500).json({
            status: "0",
            msg: "Error procesando la operación",
            error: error.message
        });
    }
};

equipoCtrl.deleteEquipo = async (req, res) => {
    /*
    #swagger.tags = ['Equipos']
    #swagger.summary = 'Eliminar un Equipo'
    #swagger.description = 'Elimina un equipo de la base de datos usando su ID. Solo accesible para administradores.'
    #swagger.security = [{ "bearerAuth": [] }]
    */
    try {
        const equipo = await Equipo.findByPk(req.params.id);
        
        if (!equipo) {
            return res.status(404).json({
                status: "0",
                msg: "Equipo no encontrado para eliminar"
            });
        }
        
        // Verificar si hay referencias al equipo en otras tablas
        // Por ejemplo, si hubiera una tabla de partidos, inscripciones, etc.
        // Este es un ejemplo genérico, se debe adaptar según las relaciones existentes
        /*
        const relacionesExistentes = await OtroModelo.count({
            where: { idEquipo: req.params.id }
        });
        
        if (relacionesExistentes > 0) {
            return res.status(400).json({
                status: "0",
                msg: `No se puede eliminar el equipo porque tiene ${relacionesExistentes} registros asociados`
            });
        }
        */

        // Eliminar el equipo
        await equipo.destroy();
        
        res.status(200).json({
            status: "1",
            msg: "Equipo eliminado exitosamente"
        });
    } catch (error) {
        console.error("Error en deleteEquipo:", error);
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(400).json({
                status: "0",
                msg: "No se puede eliminar el equipo porque está asociado a otros registros",
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

equipoCtrl.getEquipoFiltro = async (req, res) => {
    /*
    #swagger.tags = ['Equipos']
    #swagger.summary = 'Filtrar Equipos'
    #swagger.description = 'Retorna equipos que coinciden con los criterios de filtro (nombre, idClub, idCategoria).'
    #swagger.parameters['nombre'] = { in: 'query', description: 'Filtra por nombre del equipo.', type: 'string' }
    #swagger.parameters['idClub'] = { in: 'query', description: 'Filtra por ID del Club asociado.', type: 'integer' }
    #swagger.parameters['idCategoria'] = { in: 'query', description: 'Filtra por ID de la Categoría asociada.', type: 'integer' }
    #swagger.parameters['nombreDelegado'] = { in: 'query', description: 'Filtra por nombre del delegado.', type: 'string' }
    */
    const query = req.query;
    const criteria = {};

    if (query.nombre) {
        criteria.nombre = { [Op.iLike]: `%${query.nombre}%` };
    }
    if (query.idClub) {
        criteria.idClub = query.idClub;
    }
    if (query.idCategoria) {
        criteria.idCategoria = query.idCategoria;
    }
    if (query.nombreDelegado) {
        criteria.nombreDelegado = { [Op.iLike]: `%${query.nombreDelegado}%` };
    }

    try {
        const equipos = await Equipo.findAll({
            where: criteria,
            include: [
                { 
                    model: Club, 
                    as: 'club', 
                    attributes: ['idClub', 'nombre'] 
                },
                { 
                    model: Categoria, 
                    as: 'categoria', 
                    attributes: ['idCategoria', 'nombre'] 
                }
            ],
            order: [['nombre', 'ASC']]
        });
        
        res.status(200).json(equipos);
    } catch (error) {
        console.error("Error en getEquipoFiltro:", error);
        res.status(500).json({
            status: "0",
            msg: "Error procesando la operación",
            error: error.message
        });
    }
};

module.exports = equipoCtrl;