const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

/**
 * Servicio para gestionar subidas de imágenes a ImgBB
 */
const imgbbService = {};

// API key de ImgBB
const IMGBB_API_KEY = process.env.IMGBB_API_KEY || 'e4e4d4e537db716685b25edc62906050';
const IMGBB_API_URL = 'https://api.imgbb.com/1/upload';

/**
 * Sube una imagen a ImgBB
 * @param {Buffer|string} imageData - Buffer de imagen o base64
 * @param {string} name - Nombre para la imagen
 * @returns {Promise<object>} - Respuesta de ImgBB
 */
imgbbService.uploadImage = async (imageData, name = null) => {
    try {
        const form = new FormData();
        
        // Si es buffer, convertir a base64
        if (Buffer.isBuffer(imageData)) {
            form.append('image', imageData.toString('base64'));
        } else {
            form.append('image', imageData);
        }
        
        // Agregar parámetros opcionales
        if (name) {
            form.append('name', name);
        }
        
        // Construir URL con parámetros
        let url = `${IMGBB_API_URL}?key=${IMGBB_API_KEY}`;
        
        // Configurar opciones para la solicitud
        const config = {
            headers: form.getHeaders()
        };
        
        // Hacer la solicitud a la API de ImgBB
        const response = await axios.post(url, form, config);
        
        return {
            success: true,
            data: response.data.data
        };
    } catch (error) {
        console.error('Error al subir imagen a ImgBB:', error);
        return {
            success: false,
            error: error.message || 'Error desconocido al subir imagen'
        };
    }
};

/**
 * Sube una foto de perfil a ImgBB
 * @param {Buffer} imageBuffer - Buffer de imagen
 * @param {string} personaId - ID de la persona
 * @returns {Promise<object>} - Respuesta de la API
 */
imgbbService.uploadProfilePicture = async (imageBuffer, personaId) => {
    // Nombre específico para fotos de perfil
    const name = `FJV_perfil_${personaId}_${Date.now()}`;
    
    // Subir a ImgBB
    return await imgbbService.uploadImage(imageBuffer, name);
};

/**
 * Elimina una imagen de ImgBB usando la URL de eliminación
 * @param {string} deleteUrl - URL de eliminación
 * @returns {Promise<object>}
 */
imgbbService.deleteImage = async (deleteUrl) => {
    try {
        if (!deleteUrl) {
            throw new Error('URL de eliminación no proporcionada');
        }
        
        // Hacer la solicitud para eliminar la imagen
        await axios.get(deleteUrl);
        
        return {
            success: true,
            message: 'Imagen eliminada correctamente'
        };
    } catch (error) {
        console.error('Error al eliminar imagen de ImgBB:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

module.exports = imgbbService;
