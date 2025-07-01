const axios = require('axios');
const FormData = require('form-data');

/**
 * Servicio para integración con ImgBB
 * Permite subir imágenes y manejar sus URLs
 */
const imgbbService = {};

/**
 * Sube una imagen a ImgBB
 * @param {Buffer} imageBuffer - Buffer de la imagen a subir
 * @param {String} name - Nombre para la imagen
 * @returns {Promise<Object>} - Resultado de la operación
 */
imgbbService.uploadImage = async (imageBuffer, name) => {
    try {
        // Verificar API key
        const apiKey = process.env.IMGBB_API_KEY;
        if (!apiKey) {
            return {
                success: false,
                error: 'API key de ImgBB no configurada'
            };
        }

        // Convertir buffer a base64
        const base64Image = imageBuffer.toString('base64');
        
        // Preparar datos para ImgBB
        const formData = new FormData();
        formData.append('key', apiKey);
        formData.append('image', base64Image);
        formData.append('name', name || `uploaded_${Date.now()}`);

        console.log(`Subiendo imagen "${name}" a ImgBB...`);

        // Hacer la solicitud a ImgBB
        const response = await axios.post('https://api.imgbb.com/1/upload', formData);

        // Validar respuesta
        if (!response.data || !response.data.success) {
            throw new Error('Error en respuesta de ImgBB');
        }

        console.log(`✅ Imagen "${name}" subida exitosamente a ImgBB`);
        
        return {
            success: true,
            data: response.data.data
        };
    } catch (error) {
        console.error('Error al subir imagen a ImgBB:', error.message);
        return {
            success: false,
            error: error.message || 'Error desconocido al subir imagen'
        };
    }
};

/**
 * Elimina una imagen de ImgBB usando su URL de eliminación
 * @param {String} deleteUrl - URL de eliminación proporcionada por ImgBB
 * @returns {Promise<Object>} - Resultado de la operación
 */
imgbbService.deleteImage = async (deleteUrl) => {
    try {
        if (!deleteUrl) {
            return {
                success: false,
                error: 'URL de eliminación no proporcionada'
            };
        }

        console.log(`Eliminando imagen con URL: ${deleteUrl.substring(0, 30)}...`);
        
        // ImgBB no tiene una API formal para eliminar, la URL de eliminación es una página web
        // Por lo que simulamos una visita a esa URL
        await axios.get(deleteUrl);
        
        return {
            success: true,
            message: 'Solicitud de eliminación enviada'
        };
    } catch (error) {
        console.error('Error al eliminar imagen de ImgBB:', error.message);
        return {
            success: false,
            error: error.message || 'Error desconocido al eliminar imagen'
        };
    }
};

module.exports = imgbbService;
