const axios = require('axios');
const FormData = require('form-data');

// API Key de ImgBB - debería estar en variables de entorno
const IMGBB_API_KEY = process.env.IMGBB_API_KEY;

const imgbbService = {
    /**
     * Sube una imagen a ImgBB
     * @param {Buffer|string} imageData - Buffer de la imagen o string base64
     * @param {string} name - Nombre para la imagen
     * @returns {Promise} Resultado de la operación
     */
    uploadImage: async (imageData, name) => {
        try {
            if (!IMGBB_API_KEY) {
                throw new Error('ImgBB API Key no configurada');
            }

            const form = new FormData();
            form.append('key', IMGBB_API_KEY);
            
            // Puede ser un buffer o string base64 (sin el prefijo data:image/*)
            if (Buffer.isBuffer(imageData)) {
                form.append('image', imageData.toString('base64'));
            } else {
                form.append('image', imageData);
            }
            
            if (name) {
                form.append('name', name);
            }

            const response = await axios.post('https://api.imgbb.com/1/upload', form, {
                headers: form.getHeaders()
            });

            if (response.data.success) {
                return {
                    success: true,
                    data: response.data.data
                };
            } else {
                throw new Error('Error en respuesta de ImgBB');
            }
        } catch (error) {
            console.error('Error en imgbbService.uploadImage:', error);
            return {
                success: false,
                error: error.message || 'Error al subir imagen a ImgBB'
            };
        }
    }
};

module.exports = imgbbService;
