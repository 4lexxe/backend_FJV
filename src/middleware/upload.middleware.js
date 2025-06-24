/**
 * Middleware para manejo de subida de archivos
 * Configurado para fotos de perfil con límite de 4MB
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Crear directorio para uploads si no existe
const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'profile-photos');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuración de almacenamiento
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        // Generar nombre único: persona_[id]_[timestamp].[extensión]
        const timestamp = Date.now();
        const personaId = req.params.id || 'new';
        const extension = path.extname(file.originalname);
        const filename = `persona_${personaId}_${timestamp}${extension}`;
        cb(null, filename);
    }
});

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
        fileSize: 4 * 1024 * 1024, // 4MB en bytes
        files: 1 // Solo un archivo por vez
    },
    fileFilter: fileFilter
});

/**
 * Middleware para subir foto de perfil
 */
const uploadProfilePhoto = upload.single('fotoPerfil');

/**
 * Middleware wrapper para manejo de errores de multer
 */
const handleUploadErrors = (req, res, next) => {
    uploadProfilePhoto(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            // Errores específicos de multer
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    status: "0",
                    msg: "El archivo es demasiado grande. El tamaño máximo permitido es 4MB"
                });
            }
            if (err.code === 'LIMIT_FILE_COUNT') {
                return res.status(400).json({
                    status: "0",
                    msg: "Solo se permite subir un archivo por vez"
                });
            }
            if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                return res.status(400).json({
                    status: "0",
                    msg: "Campo de archivo inesperado. Use 'fotoPerfil' como nombre del campo"
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
 * Función para convertir imagen a base64
 */
const convertToBase64 = (filePath) => {
    try {
        const imageBuffer = fs.readFileSync(filePath);
        const base64String = imageBuffer.toString('base64');
        return base64String;
    } catch (error) {
        console.error('Error convirtiendo imagen a base64:', error);
        return null;
    }
};

/**
 * Función para eliminar archivo temporal
 */
const deleteFile = (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (error) {
        console.error('Error eliminando archivo temporal:', error);
    }
};

/**
 * Middleware para procesar la imagen subida y convertirla a base64
 */
const processUploadedImage = (req, res, next) => {
    // Log para depuración
    console.log('processUploadedImage - req.body:', req.body);
    console.log('processUploadedImage - req.file:', req.file ? 'Archivo presente' : 'Sin archivo');
    
    if (req.file) {
        try {
            // Convertir a base64
            const base64Image = convertToBase64(req.file.path);
            
            if (base64Image) {
                // Agregar datos de la imagen al request
                req.imageData = {
                    fotoPerfil: base64Image,
                    fotoPerfilTipo: req.file.mimetype,
                    fotoPerfilTamano: req.file.size
                };
                
                console.log('Imagen procesada correctamente, tamaño:', req.file.size);
                
                // Eliminar archivo temporal
                deleteFile(req.file.path);
            } else {
                // Si no se pudo convertir, eliminar archivo y continuar sin imagen
                deleteFile(req.file.path);
                req.imageData = null;
            }
        } catch (error) {
            console.error('Error procesando imagen:', error);
            deleteFile(req.file.path);
            req.imageData = null;
        }
    } else {
        // No hay archivo, continuar sin datos de imagen
        req.imageData = null;
        console.log('No se recibió archivo de imagen');
    }
    
    next();
};

module.exports = {
    handleUploadErrors,
    processUploadedImage,
    convertToBase64,
    deleteFile
};
