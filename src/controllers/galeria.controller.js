/**
 * Controlador para manejo de galerías de imágenes
 */
const Galeria = require('../models/Galeria');
const Imagen = require('../models/Imagen');
const imgbbService = require('../services/imgbb.service');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

const galeriaCtrl = {};

/**
 * Obtener todas las galerías
 */
galeriaCtrl.getGalerias = async (req, res) => {
    /*
    #swagger.tags = ['Galerías']
    #swagger.summary = 'Obtener todas las galerías'
    #swagger.description = 'Retorna todas las galerías con información básica'
    */
    try {
        const { publicadas } = req.query;
        
        // Construir filtros
        let where = {};
        
        // Si el parámetro publicadas es true, filtrar solo las publicadas
        if (publicadas === 'true') {
            where.publicada = true;
        }
        
        const galerias = await Galeria.findAll({
            where,
            include: [
                {
                    model: Imagen,
                    as: 'imagenes',
                    attributes: ['idImagen', 'url', 'thumbUrl', 'titulo'],
                    limit: 1, // Solo incluir una imagen para previsualización
                    order: [['orden', 'ASC']]
                }
            ],
            order: [['fechaCreacion', 'DESC']]
        });
        
        res.status(200).json({
            status: "1",
            msg: "Galerías obtenidas exitosamente",
            galerias
        });
    } catch (error) {
        console.error("Error en getGalerias:", error);
        res.status(500).json({
            status: "0",
            msg: "Error al obtener las galerías",
            error: error.message
        });
    }
};

/**
 * Obtener una galería específica por ID
 */
galeriaCtrl.getGaleria = async (req, res) => {
    /*
    #swagger.tags = ['Galerías']
    #swagger.summary = 'Obtener una galería por ID'
    #swagger.description = 'Retorna una galería específica con todas sus imágenes'
    */
    try {
        const { id } = req.params;
        
        const galeria = await Galeria.findByPk(id, {
            include: [
                {
                    model: Imagen,
                    as: 'imagenes',
                    order: [['orden', 'ASC']]
                }
            ]
        });
        
        if (!galeria) {
            return res.status(404).json({
                status: "0",
                msg: "Galería no encontrada"
            });
        }
        
        // Si no es admin y la galería no está publicada, devolver error
        if (!galeria.publicada && (!req.user || !req.user.rol || req.user.rol.nombre !== 'admin')) {
            return res.status(403).json({
                status: "0",
                msg: "No tienes permiso para ver esta galería"
            });
        }
        
        res.status(200).json({
            status: "1",
            galeria
        });
    } catch (error) {
        console.error("Error en getGaleria:", error);
        res.status(500).json({
            status: "0",
            msg: "Error al obtener la galería",
            error: error.message
        });
    }
};

/**
 * Crear una nueva galería
 */
galeriaCtrl.crearGaleria = async (req, res) => {
    /*
    #swagger.tags = ['Galerías']
    #swagger.summary = 'Crear una nueva galería'
    #swagger.description = 'Crea una nueva galería vacía'
    */
    try {
        const { nombre, descripcion, publicada = true } = req.body;
        
        if (!nombre) {
            return res.status(400).json({
                status: "0",
                msg: "El nombre de la galería es obligatorio"
            });
        }
        
        const galeria = await Galeria.create({
            nombre,
            descripcion,
            publicada,
            autorId: req.user ? req.user.id : null
        });
        
        res.status(201).json({
            status: "1",
            msg: "Galería creada exitosamente",
            galeria
        });
    } catch (error) {
        console.error("Error en crearGaleria:", error);
        res.status(500).json({
            status: "0",
            msg: "Error al crear la galería",
            error: error.message
        });
    }
};

/**
 * Actualizar una galería existente
 */
galeriaCtrl.actualizarGaleria = async (req, res) => {
    /*
    #swagger.tags = ['Galerías']
    #swagger.summary = 'Actualizar una galería'
    #swagger.description = 'Actualiza los datos de una galería existente'
    */
    try {
        const { id } = req.params;
        const { nombre, descripcion, publicada, portada } = req.body;
        
        const galeria = await Galeria.findByPk(id);
        
        if (!galeria) {
            return res.status(404).json({
                status: "0",
                msg: "Galería no encontrada"
            });
        }
        
        // Actualizar campos
        if (nombre !== undefined) galeria.nombre = nombre;
        if (descripcion !== undefined) galeria.descripcion = descripcion;
        if (publicada !== undefined) galeria.publicada = publicada;
        if (portada !== undefined) galeria.portada = portada;
        
        await galeria.save();
        
        res.status(200).json({
            status: "1",
            msg: "Galería actualizada exitosamente",
            galeria
        });
    } catch (error) {
        console.error("Error en actualizarGaleria:", error);
        res.status(500).json({
            status: "0",
            msg: "Error al actualizar la galería",
            error: error.message
        });
    }
};

/**
 * Eliminar una galería
 */
galeriaCtrl.eliminarGaleria = async (req, res) => {
    /*
    #swagger.tags = ['Galerías']
    #swagger.summary = 'Eliminar una galería'
    #swagger.description = 'Elimina una galería y todas sus imágenes'
    */
    try {
        const { id } = req.params;
        const { eliminarImagenesImgbb } = req.query; // Si es true, también elimina las imágenes de ImgBB
        
        // Iniciar transacción
        const transaction = await sequelize.transaction();
        
        try {
            // Buscar la galería con sus imágenes
            const galeria = await Galeria.findByPk(id, {
                include: [
                    {
                        model: Imagen,
                        as: 'imagenes'
                    }
                ]
            });
            
            if (!galeria) {
                await transaction.rollback();
                return res.status(404).json({
                    status: "0",
                    msg: "Galería no encontrada"
                });
            }
            
            // Si se solicita eliminar también de ImgBB
            if (eliminarImagenesImgbb === 'true' && galeria.imagenes && galeria.imagenes.length > 0) {
                for (const imagen of galeria.imagenes) {
                    if (imagen.deleteUrl) {
                        try {
                            await imgbbService.deleteImage(imagen.deleteUrl);
                        } catch (err) {
                            console.error(`Error al eliminar imagen de ImgBB:`, err);
                            // Continuar aunque falle la eliminación de algunas imágenes
                        }
                    }
                }
            }
            
            // Eliminar la galería (esto eliminará también las imágenes por CASCADE)
            await galeria.destroy({ transaction });
            
            await transaction.commit();
            
            res.status(200).json({
                status: "1",
                msg: "Galería eliminada exitosamente"
            });
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    } catch (error) {
        console.error("Error en eliminarGaleria:", error);
        res.status(500).json({
            status: "0",
            msg: "Error al eliminar la galería",
            error: error.message
        });
    }
};

/**
 * Añadir imágenes a una galería
 * Este endpoint recibe las imágenes ya subidas a ImgBB desde el middleware
 */
galeriaCtrl.agregarImagenes = async (req, res) => {
    /*
    #swagger.tags = ['Galerías']
    #swagger.summary = 'Añadir imágenes a una galería'
    #swagger.description = 'Añade nuevas imágenes a una galería existente'
    */
    try {
        const { idGaleria } = req.params;
        
        // Verificar que las imágenes se hayan subido correctamente
        if (!req.imgbbData || !req.imgbbData.imagenes || req.imgbbData.imagenes.length === 0) {
            return res.status(400).json({
                status: "0",
                msg: "No se recibieron imágenes para agregar"
            });
        }
        
        // Verificar que la galería existe
        const galeria = await Galeria.findByPk(idGaleria);
        if (!galeria) {
            return res.status(404).json({
                status: "0",
                msg: "Galería no encontrada"
            });
        }
        
        // Obtener el orden máximo actual
        const maxOrden = await Imagen.max('orden', {
            where: { idGaleria: idGaleria }
        }) || 0;
        
        let ordenActual = maxOrden;
        
        // Iniciar transacción
        const transaction = await sequelize.transaction();
        
        try {
            // Crear registros para las nuevas imágenes
            const imagenes = [];
            
            for (const img of req.imgbbData.imagenes) {
                ordenActual++;
                const imagen = await Imagen.create({
                    idGaleria: idGaleria,
                    titulo: req.body.titulo || img.title || `Imagen ${ordenActual}`,
                    url: img.url,
                    thumbUrl: img.thumbUrl,
                    deleteUrl: img.deleteUrl,
                    orden: ordenActual,
                    fechaSubida: new Date(),
                    metadatos: {
                        width: img.width,
                        height: img.height,
                        size: img.size
                    }
                }, { transaction });
                
                imagenes.push(imagen);
            }
            
            // Si la galería no tiene portada, usar la primera imagen como portada
            if (!galeria.portada && imagenes.length > 0) {
                await galeria.update({
                    portada: imagenes[0].url
                }, { transaction });
            }
            
            await transaction.commit();
            
            res.status(201).json({
                status: "1",
                msg: "Imágenes añadidas exitosamente",
                imagenes,
                errores: req.imgbbData.errores
            });
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    } catch (error) {
        console.error("Error en agregarImagenes:", error);
        res.status(500).json({
            status: "0",
            msg: "Error al agregar imágenes",
            error: error.message
        });
    }
};

/**
 * Actualizar los datos de una imagen
 */
galeriaCtrl.actualizarImagen = async (req, res) => {
    /*
    #swagger.tags = ['Galerías']
    #swagger.summary = 'Actualizar una imagen'
    #swagger.description = 'Actualiza los datos de una imagen existente en una galería'
    */
    try {
        const { idImagen } = req.params;
        const { titulo, orden } = req.body;
        
        const imagen = await Imagen.findByPk(idImagen);
        
        if (!imagen) {
            return res.status(404).json({
                status: "0",
                msg: "Imagen no encontrada"
            });
        }
        
        // Actualizar campos
        if (titulo !== undefined) imagen.titulo = titulo;
        if (orden !== undefined) imagen.orden = orden;
        
        await imagen.save();
        
        res.status(200).json({
            status: "1",
            msg: "Imagen actualizada exitosamente",
            imagen
        });
    } catch (error) {
        console.error("Error en actualizarImagen:", error);
        res.status(500).json({
            status: "0",
            msg: "Error al actualizar la imagen",
            error: error.message
        });
    }
};

/**
 * Eliminar una imagen de una galería
 */
galeriaCtrl.eliminarImagen = async (req, res) => {
    /*
    #swagger.tags = ['Galerías']
    #swagger.summary = 'Eliminar una imagen'
    #swagger.description = 'Elimina una imagen de una galería'
    */
    try {
        const { idImagen } = req.params;
        const { eliminarDeImgbb } = req.query; // Si es true, también elimina de ImgBB
        
        const imagen = await Imagen.findByPk(idImagen);
        
        if (!imagen) {
            return res.status(404).json({
                status: "0",
                msg: "Imagen no encontrada"
            });
        }
        
        // Si se solicita eliminar también de ImgBB
        if (eliminarDeImgbb === 'true' && imagen.deleteUrl) {
            try {
                await imgbbService.deleteImage(imagen.deleteUrl);
            } catch (error) {
                console.error("Error al eliminar imagen de ImgBB:", error);
                // Continuar aunque falle la eliminación de ImgBB
            }
        }
        
        // Eliminar la imagen de la base de datos
        await imagen.destroy();
        
        res.status(200).json({
            status: "1",
            msg: "Imagen eliminada exitosamente"
        });
    } catch (error) {
        console.error("Error en eliminarImagen:", error);
        res.status(500).json({
            status: "0",
            msg: "Error al eliminar la imagen",
            error: error.message
        });
    }
};

/**
 * Reordenar imágenes de una galería
 */
galeriaCtrl.reordenarImagenes = async (req, res) => {
    /*
    #swagger.tags = ['Galerías']
    #swagger.summary = 'Reordenar imágenes'
    #swagger.description = 'Actualiza el orden de las imágenes en una galería'
    */
    try {
        const { idGaleria } = req.params;
        const { ordenamiento } = req.body;
        
        if (!Array.isArray(ordenamiento)) {
            return res.status(400).json({
                status: "0",
                msg: "El ordenamiento debe ser un array de objetos {idImagen, orden}"
            });
        }
        
        // Verificar que la galería existe
        const galeria = await Galeria.findByPk(idGaleria);
        if (!galeria) {
            return res.status(404).json({
                status: "0",
                msg: "Galería no encontrada"
            });
        }
        
        // Iniciar transacción
        const transaction = await sequelize.transaction();
        
        try {
            // Actualizar el orden de cada imagen
            for (const item of ordenamiento) {
                await Imagen.update(
                    { orden: item.orden },
                    { 
                        where: { 
                            idImagen: item.idImagen,
                            idGaleria: idGaleria
                        },
                        transaction
                    }
                );
            }
            
            await transaction.commit();
            
            // Obtener las imágenes con el nuevo orden
            const imagenes = await Imagen.findAll({
                where: { idGaleria },
                order: [['orden', 'ASC']]
            });
            
            res.status(200).json({
                status: "1",
                msg: "Imágenes reordenadas exitosamente",
                imagenes
            });
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    } catch (error) {
        console.error("Error en reordenarImagenes:", error);
        res.status(500).json({
            status: "0",
            msg: "Error al reordenar las imágenes",
            error: error.message
        });
    }
};

/**
 * Establecer imagen de portada
 */
galeriaCtrl.establecerPortada = async (req, res) => {
    /*
    #swagger.tags = ['Galerías']
    #swagger.summary = 'Establecer imagen de portada'
    #swagger.description = 'Establece una imagen específica como portada de la galería'
    */
    try {
        const { idGaleria, idImagen } = req.params;
        
        // Verificar que la galería existe
        const galeria = await Galeria.findByPk(idGaleria);
        if (!galeria) {
            return res.status(404).json({
                status: "0",
                msg: "Galería no encontrada"
            });
        }
        
        // Verificar que la imagen existe y pertenece a esta galería
        const imagen = await Imagen.findOne({
            where: {
                idImagen,
                idGaleria
            }
        });
        
        if (!imagen) {
            return res.status(404).json({
                status: "0",
                msg: "Imagen no encontrada en esta galería"
            });
        }
        
        // Actualizar la portada
        await galeria.update({
            portada: imagen.url
        });
        
        res.status(200).json({
            status: "1",
            msg: "Portada establecida exitosamente",
            galeria: {
                ...galeria.toJSON(),
                portada: imagen.url
            }
        });
    } catch (error) {
        console.error("Error en establecerPortada:", error);
        res.status(500).json({
            status: "0",
            msg: "Error al establecer la portada",
            error: error.message
        });
    }
};

/**
 * Buscar galerías por nombre o descripción
 */
galeriaCtrl.buscarGalerias = async (req, res) => {
    /*
    #swagger.tags = ['Galerías']
    #swagger.summary = 'Buscar galerías'
    #swagger.description = 'Busca galerías por nombre o descripción'
    */
    try {
        const { query } = req.query;
        
        if (!query) {
            return res.status(400).json({
                status: "0",
                msg: "Se requiere un término de búsqueda"
            });
        }
        
        // Filtrar por nombre o descripción
        const galerias = await Galeria.findAll({
            where: {
                [Op.or]: [
                    { nombre: { [Op.iLike]: `%${query}%` } },
                    { descripcion: { [Op.iLike]: `%${query}%` } }
                ]
            },
            include: [
                {
                    model: Imagen,
                    as: 'imagenes',
                    attributes: ['idImagen', 'url', 'thumbUrl'],
                    limit: 1
                }
            ],
            order: [['fechaCreacion', 'DESC']]
        });
        
        res.status(200).json({
            status: "1",
            msg: "Búsqueda exitosa",
            galerias
        });
    } catch (error) {
        console.error("Error en buscarGalerias:", error);
        res.status(500).json({
            status: "0",
            msg: "Error al buscar galerías",
            error: error.message
        });
    }
};

module.exports = galeriaCtrl;
