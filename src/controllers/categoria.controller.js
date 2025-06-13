const Categoria = require("../models/Categoria");
const Equipo = require("../models/Equipo");
const { Op } = require('sequelize');

const categoriaCtrl = {};

categoriaCtrl.getCategorias = async (req, res) => {
    /*
    #swagger.tags = ['Categorias']
    #swagger.summary = 'Obtener todas las Categorías'
    #swagger.description = 'Retorna una lista de todas las categorías registradas, incluyendo los equipos asociados.'
    */
    try {
        const categorias = await Categoria.findAll({
            include: {
                model: Equipo,
                as: 'equipos', 
                attributes: ['idEquipo', 'nombre', 'nombreDelegado']
            }
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
    #swagger.description = 'Agrega una nueva categoría a la base de datos.'
    #swagger.parameters['body'] = {
        in: 'body',
        description: 'Datos de la categoría a crear.',
        required: true,
        schema: { $ref: '#/definitions/Categoria' }
    }
    */
    try {
        const categoria = await Categoria.create(req.body);
        res.status(201).json({
            status: "1",
            msg: "Categoría guardada.",
            categoria: categoria
        });
    } catch (error) {
        console.error("Error en createCategoria:", error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({
                status: "0",
                msg: "El nombre de la categoría ya está registrado.",
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

categoriaCtrl.getCategoria = async (req, res) => {
    /*
    #swagger.tags = ['Categorias']
    #swagger.summary = 'Obtener Categoría por ID'
    #swagger.description = 'Retorna una categoría específica usando su ID, incluyendo los equipos asociados.'
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
                msg: "Categoría no encontrada."
            });
        }
        res.status(200).json(categoria);
    } catch (error) {
        console.error("Error en getCategoria:", error);
        res.status(500).json({
            status: "0",
            msg: "Error procesando la operación.",
            error: error.message
        });
    }
};

categoriaCtrl.editCategoria = async (req, res) => {
    /*
    #swagger.tags = ['Categorias']
    #swagger.summary = 'Actualizar una Categoría'
    #swagger.description = 'Actualiza la información de una categoría existente usando su ID.'
    #swagger.parameters['body'] = {
        in: 'body',
        description: 'Datos de la categoría a actualizar.',
        required: true,
        schema: { $ref: '#/definitions/Categoria' }
    }
    */
    try {
        const [updatedRowsCount, updatedCategorias] = await Categoria.update(req.body, {
            where: { idCategoria: req.params.id },
            returning: true
        });

        if (updatedRowsCount === 0) {
            return res.status(404).json({
                status: "0",
                msg: "Categoría no encontrada para actualizar."
            });
        }

        res.status(200).json({
            status: "1",
            msg: "Categoría actualizada.",
            categoria: updatedCategorias[0]
        });
    } catch (error) {
        console.error("Error en editCategoria:", error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({
                status: "0",
                msg: "El nombre de la categoría ya está registrado en otra categoría.",
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

categoriaCtrl.deleteCategoria = async (req, res) => {
    /*
    #swagger.tags = ['Categorias']
    #swagger.summary = 'Eliminar una Categoría'
    #swagger.description = 'Elimina una categoría de la base de datos usando su ID. **¡Advertencia: Si hay equipos asociados a esta categoría, la eliminación podría fallar si no se gestiona la eliminación en cascada!**'
    */
    try {
        const deletedRows = await Categoria.destroy({
            where: { idCategoria: req.params.id }
        });

        if (deletedRows === 0) {
            return res.status(404).json({
                status: "0",
                msg: "Categoría no encontrada para eliminar."
            });
        }

        res.status(200).json({
            status: "1",
            msg: "Categoría eliminada."
        });
    } catch (error) {
        console.error("Error en deleteCategoria:", error);
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(400).json({
                status: "0",
                msg: "No se puede eliminar la categoría porque está asociada a equipos y la eliminación en cascada no está configurada.",
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

module.exports = categoriaCtrl;