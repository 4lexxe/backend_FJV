/**
 * Middleware para manejo de subida de imágenes para galerías
 */

const multer = require('multer');
const imgbbService = require('../services/imgbb.service');

// Usar memoria para subir directo a ImgBB sin archivos temporales
const storage = multer.memoryStorage();

// Filtro para tipos de archivo permitidos
const fileFilter = (req, file, cb) => {
    // Verificar que sea una imagen
    if (file.mimetype.startsWith('image/')) {
        // Tipos específicos permitidos
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de archivo no permitido. Solo se permiten: JPEG, PNG, GIF, WebP'), false);
        }
    } else {
        cb(new Error('El archivo debe ser una imagen'), false);
    }
};

// Configuración de multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB en bytes
        files: 5 // Máximo 5 archivos por solicitud
    },
    fileFilter: fileFilter
});

/**
 * Middleware para subir múltiples imágenes para galería
 */
const uploadGaleriaImagenes = upload.array('imagenes', 5);

/**
 * Middleware wrapper para manejo de errores de multer
 */
const handleUploadErrors = (req, res, next) => {
    uploadGaleriaImagenes(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            // Errores específicos de multer
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    status: "0",
                    msg: "El archivo es demasiado grande. El tamaño máximo permitido es 10MB"
                });
            }
            if (err.code === 'LIMIT_FILE_COUNT') {
                return res.status(400).json({
                    status: "0",
                    msg: "Demasiados archivos. Máximo 5 imágenes por vez"
                });
            }
            return res.status(400).json({
                status: "0",
                msg: `Error de subida: ${err.message}`
            });
        } else if (err) {
            // Errores del filtro personalizado
            return res.status(400).json({
                status: "0",
                msg: err.message
            });
        }
        
        // Si no hay errores, continuar
        next();
    });
};

/**
 * Middleware para subir todas las imágenes a ImgBB
 */
const uploadToImgBB = async (req, res, next) => {
    try {
        // Verificar si hay archivos
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                status: "0",
                msg: "No se recibieron imágenes"
            });
        }
        
        const galeriaId = req.params.idGaleria || req.body.idGaleria || 'nueva';
        const resultados = [];
        const errores = [];
        
        // Procesar cada archivo
        for (const file of req.files) {
            try {
                // Generar nombre para la imagen
                const nombre = `FJV_galeria_${galeriaId}_${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`;
                
                // Subir a ImgBB
                const resultado = await imgbbService.uploadImage(file.buffer, nombre);
                
                if (resultado.success) {
                    resultados.push({
                        url: resultado.data.url,
                        thumbUrl: resultado.data.thumb?.url || resultado.data.url,
                        deleteUrl: resultado.data.delete_url,
                        title: req.body.titulo || nombre,
                        width: resultado.data.width,
                        height: resultado.data.height,
                        size: resultado.data.size
                    });
                } else {
                    errores.push(`Error al subir ${file.originalname}: ${resultado.error}`);
                }
            } catch (error) {
                console.error(`Error al procesar ${file.originalname}:`, error);
                errores.push(`Error al procesar ${file.originalname}: ${error.message}`);
            }
        }
        
        if (resultados.length === 0 && errores.length > 0) {
            return res.status(500).json({
                status: "0",
                msg: "Ninguna imagen pudo ser subida",
                errores
            });
        }
        
        // Guardar los resultados en req para uso posterior
        req.imgbbData = {
            imagenes: resultados,
            errores: errores.length > 0 ? errores : null
        };
        
        next();
    } catch (error) {
        console.error('Error general en uploadToImgBB:', error);
        res.status(500).json({
            status: "0",
            msg: "Error procesando las imágenes",
            error: error.message
        });
    }
};

module.exports = {
    handleUploadErrors,
    uploadToImgBB
};
