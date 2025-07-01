const express = require('express');
const router = express.Router();
const galeriaCtrl = require('../controllers/galeria.controller');
const { authenticate, authorize, optionalAuthenticate } = require('../middleware/auth.middleware');
const { handleUploadErrors, uploadToImgBB } = require('../middleware/upload-galeria.middleware');

// === Rutas para galerías ===

// IMPORTANTE: El orden de las rutas es crítico - las rutas específicas van primero
// Ruta de búsqueda (debe ir antes de /:id para que no sea interpretada como un ID)
router.get('/buscar/galerias', optionalAuthenticate, galeriaCtrl.buscarGalerias);

// Rutas públicas (solo lectura)
router.get('/', optionalAuthenticate, galeriaCtrl.getGalerias);
router.get('/:id', optionalAuthenticate, galeriaCtrl.getGaleria);

// Rutas protegidas (solo admin)
router.post('/', authenticate, authorize('admin'), galeriaCtrl.crearGaleria);
router.put('/:id', authenticate, authorize('admin'), galeriaCtrl.actualizarGaleria);
router.delete('/:id', authenticate, authorize('admin'), galeriaCtrl.eliminarGaleria);

// === Rutas para imágenes ===

// Subir imágenes a una galería
router.post('/:idGaleria/imagenes', 
    authenticate, 
    authorize('admin'),
    handleUploadErrors,
    uploadToImgBB,
    galeriaCtrl.agregarImagenes
);

// Actualizar datos de una imagen
router.put('/imagen/:idImagen', authenticate, authorize('admin'), galeriaCtrl.actualizarImagen);

// Eliminar una imagen
router.delete('/imagen/:idImagen', authenticate, authorize('admin'), galeriaCtrl.eliminarImagen);

// Reordenar imágenes de una galería
router.post('/:idGaleria/reordenar', authenticate, authorize('admin'), galeriaCtrl.reordenarImagenes);

// Establecer imagen de portada
router.put('/:idGaleria/portada/:idImagen', authenticate, authorize('admin'), galeriaCtrl.establecerPortada);

module.exports = router;
