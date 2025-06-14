const Categoria = require("../models/Categoria");
const Equipo = require("../models/Equipo");
const { Op } = require('sequelize');

const categoriaCtrl = {};

categoriaCtrl.getCategorias = async (req, res) => {
    /*
    #swagger.tags = ['Categorias']
    #swagger.summary = 'Obtener todas las Categorías'
    #swagger.description = 'Retorna una lista de todas las categorías registradas, incluyendo los equipos asociados.'
    #swagger.security = [{ "bearerAuth": [] }]
    */
    try {
        const categorias = await Categoria.findAll({
            include: {
                model: Equipo,
                as: 'equipos', 
                attributes: ['idEquipo', 'nombre', 'nombreDelegado']
            },
            order: [
                ['nombre', 'ASC']
            ]
        });
        res.status(200).json(categorias);
    } catch (error) {
        console.error("Error en getCategorias:", error);
        res.status(500).json({
            status: "0",
            msg: "Error procesando la operación.",
            error: error.message
        });
    }
};

categoriaCtrl.createCategoria = async (req, res) => {
    /*
    #swagger.tags = ['Categorias']
    #swagger.summary = 'Crear una nueva Categoría'
    #swagger.description = 'Agrega una nueva categoría a la base de datos. Solo accesible para administradores.'
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.parameters['body'] = {
        in: 'body',
        description: 'Datos de la categoría a crear.',
        required: true,
        schema: { $ref: '#/definitions/Categoria' }
    }
    */
    try {
        // Validaciones de datos
        const { nombre, edadMinima, edadMaxima } = req.body;
        
        if (!nombre || nombre.trim() === '') {
            return res.status(400).json({
                status: "0",
                msg: "El nombre de la categoría es obligatorio"
            });
        }

        // Validar que edadMinima sea menor o igual a edadMaxima
        if (edadMinima !== null && edadMaxima !== null && 
            parseInt(edadMinima) > parseInt(edadMaxima)) {
            return res.status(400).json({
                status: "0",
                msg: "La edad mínima no puede ser mayor que la edad máxima"
            });
        }

        // Verificar si ya existe una categoría con el mismo nombre
        const categoriaExistente = await Categoria.findOne({ 
            where: { nombre: { [Op.iLike]: nombre } } 
        });
        
        if (categoriaExistente) {
            return res.status(409).json({
                status: "0",
                msg: `Ya existe una categoría con el nombre '${nombre}'`
            });
        }

        const categoria = await Categoria.create(req.body);
        
        res.status(201).json({
            status: "1",
            msg: "Categoría creada exitosamente",
            categoria: categoria
        });
    } catch (error) {
        console.error("Error en createCategoria:", error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({
                status: "0",
                msg: "El nombre de la categoría ya está registrado",
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

categoriaCtrl.getCategoria = async (req, res) => {
    /*
    #swagger.tags = ['Categorias']
    #swagger.summary = 'Obtener Categoría por ID'
    #swagger.description = 'Retorna una categoría específica usando su ID, incluyendo los equipos asociados.'
    #swagger.security = [{ "bearerAuth": [] }]
    */
    try {
        const categoria = await Categoria.findByPk(req.params.id, {
            include: {
                model: Equipo,
                as: 'equipos',
                attributes: ['idEquipo', 'nombre', 'nombreDelegado']
            }
        });

        if (!categoria) {
            return res.status(404).json({
                status: "0",
                msg: "Categoría no encontrada"
            });
        }
        
        res.status(200).json(categoria);
    } catch (error) {
        console.error("Error en getCategoria:", error);
        res.status(500).json({
            status: "0",
            msg: "Error procesando la operación",
            error: error.message
        });
    }
};

categoriaCtrl.editCategoria = async (req, res) => {
    /*
    #swagger.tags = ['Categorias']
    #swagger.summary = 'Actualizar una Categoría'
    #swagger.description = 'Actualiza la información de una categoría existente usando su ID. Solo accesible para administradores.'
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.parameters['body'] = {
        in: 'body',
        description: 'Datos de la categoría a actualizar.',
        required: true,
        schema: { $ref: '#/definitions/Categoria' }
    }
    */
    try {
        // Validaciones de datos
        const { nombre, edadMinima, edadMaxima } = req.body;
        
        if (nombre && nombre.trim() === '') {
            return res.status(400).json({
                status: "0",
                msg: "El nombre de la categoría no puede estar vacío"
            });
        }

        // Validar que edadMinima sea menor o igual a edadMaxima si ambos se proporcionan
        if (edadMinima !== null && edadMaxima !== null && 
            parseInt(edadMinima) > parseInt(edadMaxima)) {
            return res.status(400).json({
                status: "0",
                msg: "La edad mínima no puede ser mayor que la edad máxima"
            });
        }

        // Verificar si existe la categoría que queremos actualizar
        const categoriaExistente = await Categoria.findByPk(req.params.id);
        if (!categoriaExistente) {
            return res.status(404).json({
                status: "0",
                msg: "Categoría no encontrada para actualizar"
            });
        }

        // Si se cambia el nombre, verificar que no exista otra categoría con ese nombre
        if (nombre && nombre !== categoriaExistente.nombre) {
            const nombreExistente = await Categoria.findOne({ 
                where: { 
                    nombre: { [Op.iLike]: nombre },
                    idCategoria: { [Op.ne]: req.params.id }
                } 
            });
            
            if (nombreExistente) {
                return res.status(409).json({
                    status: "0",
                    msg: `Ya existe una categoría con el nombre '${nombre}'`
                });
            }
        }

        // Actualizar la categoría
        await categoriaExistente.update(req.body);
        
        res.status(200).json({
            status: "1",
            msg: "Categoría actualizada exitosamente",
            categoria: categoriaExistente
        });
    } catch (error) {
        console.error("Error en editCategoria:", error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({
                status: "0",
                msg: "El nombre de la categoría ya está en uso",
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

categoriaCtrl.deleteCategoria = async (req, res) => {
    /*
    #swagger.tags = ['Categorias']
    #swagger.summary = 'Eliminar una Categoría'
    #swagger.description = 'Elimina una categoría de la base de datos usando su ID. Solo accesible para administradores.'
    #swagger.security = [{ "bearerAuth": [] }]
    */
    try {
        // Verificar si existen equipos asociados a esta categoría
        const equiposAsociados = await Equipo.count({
            where: { idCategoria: req.params.id }
        });

        if (equiposAsociados > 0) {
            return res.status(400).json({
                status: "0",
                msg: `No se puede eliminar la categoría porque tiene ${equiposAsociados} equipos asociados. Reasigne los equipos a otra categoría primero.`
            });
        }

        // Eliminar la categoría
        const deletedRows = await Categoria.destroy({
            where: { idCategoria: req.params.id }
        });

        if (deletedRows === 0) {
            return res.status(404).json({
                status: "0",
                msg: "Categoría no encontrada para eliminar"
            });
        }

        res.status(200).json({
            status: "1",
            msg: "Categoría eliminada exitosamente"
        });
    } catch (error) {
        console.error("Error en deleteCategoria:", error);
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(400).json({
                status: "0",
                msg: "No se puede eliminar la categoría porque está asociada a equipos y la eliminación en cascada no está configurada",
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

categoriaCtrl.getCategoriasFiltradas = async (req, res) => {
    /*
    #swagger.tags = ['Categorias']
    #swagger.summary = 'Filtrar Categorías'
    #swagger.description = 'Retorna categorías que coinciden con los criterios de filtro (nombre, edadMinima, edadMaxima).'
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.parameters['nombre'] = { in: 'query', description: 'Filtra por nombre de la categoría.', type: 'string' }
    #swagger.parameters['edadMinima'] = { in: 'query', description: 'Filtra por edad mínima (exacta o mayor).', type: 'integer' }
    #swagger.parameters['edadMaxima'] = { in: 'query', description: 'Filtra por edad máxima (exacta o menor).', type: 'integer' }
    */
    try {
        const { nombre, edadMinima, edadMaxima } = req.query;
        const criteria = {};

        if (nombre) {
            criteria.nombre = { [Op.iLike]: `%${nombre}%` };
        }
        
        if (edadMinima) {
            criteria.edadMinima = { [Op.gte]: edadMinima };
        }
        
        if (edadMaxima) {
            criteria.edadMaxima = { [Op.lte]: edadMaxima };
        }

        const categorias = await Categoria.findAll({
            where: criteria,
            order: [['nombre', 'ASC']],
            include: {
                model: Equipo,
                as: 'equipos',
                attributes: ['idEquipo', 'nombre']
            }
        });

        res.status(200).json(categorias);
    } catch (error) {
        console.error("Error en getCategoriasFiltradas:", error);
        res.status(500).json({
            status: "0",
            msg: "Error procesando la operación",
            error: error.message
        });
    }
};

module.exports = categoriaCtrl;