const MomentosDestacadosConfig = require('../models/MomentosDestacadosConfig');
const MomentosDestacadosImage = require('../models/MomentosDestacadosImage');
const axios = require('axios');
const FormData = require('form-data');

const IMGBB_API_KEY = process.env.IMGBB_API_KEY;
const MAX_IMAGES = 6;

/**
 * Función auxiliar para subir imagen a ImgBB
 */
async function uploadToImgBB(fileBuffer, fileName) {
  try {
    console.log('🔑 Verificando API Key de ImgBB...');
    console.log('🔑 IMGBB_API_KEY existe:', !!IMGBB_API_KEY);
    console.log('🔑 IMGBB_API_KEY longitud:', IMGBB_API_KEY ? IMGBB_API_KEY.length : 0);
    
    if (!IMGBB_API_KEY) {
      console.log('❌ IMGBB_API_KEY no está configurada');
      throw new Error('IMGBB_API_KEY no está configurada en las variables de entorno');
    }

    console.log(`📤 Preparando subida de ${fileName}...`);
    console.log(`📊 Tamaño del buffer: ${fileBuffer.length} bytes`);

    const formData = new FormData();
    formData.append('image', fileBuffer, {
      filename: fileName,
      contentType: 'image/jpeg'
    });

    console.log('🌐 Enviando petición a ImgBB...');
    const response = await axios.post(
      `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );

    console.log('📨 Respuesta de ImgBB recibida');
    console.log('✅ Status:', response.status);
    console.log('✅ Success:', response.data.success);

    if (response.data.success) {
      console.log('🎉 Imagen subida exitosamente a ImgBB');
      console.log('🔗 URL:', response.data.data.url);
      return {
        success: true,
        data: {
          url: response.data.data.url,
          delete_url: response.data.data.delete_url
        }
      };
    } else {
      console.log('❌ ImgBB respondió con success: false');
      throw new Error('Error en la respuesta de ImgBB');
    }
  } catch (error) {
    console.error('💥 Error en uploadToImgBB:');
    console.error('❌ Mensaje:', error.message);
    console.error('❌ Response data:', error.response?.data);
    console.error('❌ Response status:', error.response?.status);
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message
    };
  }
}

/**
 * Obtener configuración de momentos destacados
 */
const getMomentosDestacadosConfig = async (req, res) => {
  console.log('➡️ [MomentosDestacados] Recibida petición GET /config');
  try {
    console.log('🔍 [MomentosDestacados] Buscando configuración en BD...');
    // Añadimos timeout para evitar bloqueos infinitos
    const timeout = 5000; // 5 segundos
    
    let config = await MomentosDestacadosConfig.findOne({
      where: { activo: true },
      include: [{
        model: MomentosDestacadosImage,
        as: 'imagenes',
        where: { activo: true },
        required: false,
        order: [['orden', 'ASC']]
      }],
      // Forzar timeout y logging
      benchmark: true,
      logging: console.log
    });
    console.log('✅ [MomentosDestacados] Búsqueda finalizada. Config encontrada:', !!config);

    // Si no existe configuración, crear una por defecto
    if (!config) {
      console.log('⚠️ [MomentosDestacados] No existe configuración, creando por defecto...');
      config = await MomentosDestacadosConfig.create({
        titulo: 'Momentos Destacados',
        subTitulo: 'Los mejores momentos del voleibol jujeño',
        activo: true
      });
      console.log('✅ [MomentosDestacados] Configuración por defecto creada. ID:', config.idConfig);

      // Recargar con imágenes
      config = await MomentosDestacadosConfig.findByPk(config.idConfig, {
        include: [{
          model: MomentosDestacadosImage,
          as: 'imagenes',
          where: { activo: true },
          required: false,
          order: [['orden', 'ASC']]
        }]
      });
    }

    console.log('📤 [MomentosDestacados] Enviando respuesta al cliente...');
    res.status(200).json({
      status: '1',
      msg: 'Configuración de momentos destacados obtenida exitosamente',
      data: config
    });

  } catch (error) {
    console.error('❌ [MomentosDestacados] Error en getMomentosDestacadosConfig:', error);
    res.status(500).json({
      status: '0',
      msg: 'Error interno del servidor',
      error: error.message
    });
  }
};

/**
 * Actualizar configuración de momentos destacados
 */
const updateMomentosDestacadosConfig = async (req, res) => {
  try {
    console.log('🔥 === DEBUG: Inicio de updateMomentosDestacadosConfig ===');
    console.log('📝 Body recibido:', req.body);
    console.log('📁 Archivos recibidos:', req.files ? req.files.length : 0);
    
    const { titulo, subTitulo, metadataImagenes, imagenesParaBorrar } = req.body;
    const files = req.files?.imagenes || req.files || [];

    console.log('📊 Datos extraídos:');
    console.log('  - Título:', titulo);
    console.log('  - Subtítulo:', subTitulo);
    console.log('  - Metadata:', metadataImagenes);
    console.log('  - Imágenes para borrar:', imagenesParaBorrar);
    console.log('  - Archivos procesados:', files.length);

    // Validar datos requeridos
    if (!titulo || !subTitulo) {
      console.log('❌ Error: Faltan título o subtítulo');
      return res.status(400).json({
        status: '0',
        msg: 'Título y subtítulo son requeridos'
      });
    }

    // Obtener o crear configuración
    let config = await MomentosDestacadosConfig.findOne({
      where: { activo: true },
      include: [{
        model: MomentosDestacadosImage,
        as: 'imagenes',
        where: { activo: true },
        required: false
      }]
    });

    console.log('🔍 Configuración encontrada:', config ? `ID: ${config.idConfig}` : 'No existe, se creará nueva');

    if (!config) {
      console.log('🆕 Creando nueva configuración...');
      config = await MomentosDestacadosConfig.create({
        titulo,
        subTitulo,
        activo: true
      });
      console.log('✅ Nueva configuración creada con ID:', config.idConfig);
    } else {
      console.log('📝 Actualizando configuración existente...');
      await config.update({
        titulo,
        subTitulo,
        fechaActualizacion: new Date()
      });
      console.log('✅ Configuración actualizada');
    }

    // Marcar imágenes para borrar como inactivas
    if (imagenesParaBorrar) {
      console.log('🗑️ Procesando imágenes para borrar...');
      const imagenesABorrar = JSON.parse(imagenesParaBorrar);
      if (imagenesABorrar.length > 0) {
        console.log('🗑️ Marcando como inactivas:', imagenesABorrar);
        await MomentosDestacadosImage.update(
          { activo: false },
          { where: { idImagen: imagenesABorrar, idConfig: config.idConfig } }
        );
        console.log('✅ Imágenes marcadas como inactivas');
      }
    }

    // Procesar nuevas imágenes
    if (files.length > 0) {
      console.log('🖼️ Procesando nuevas imágenes...');
      console.log('📊 Cantidad de archivos a procesar:', files.length);
      
      // Validar límite de imágenes totales
      const imagenesActuales = await MomentosDestacadosImage.count({
        where: { idConfig: config.idConfig, activo: true }
      });
      console.log('📊 Imágenes actuales en DB:', imagenesActuales);

      if (imagenesActuales + files.length > MAX_IMAGES) {
        console.log('❌ Error: Excede límite de imágenes');
        return res.status(400).json({
          status: '0',
          msg: `Solo se permiten máximo ${MAX_IMAGES} imágenes para momentos destacados`
        });
      }

      let metadata = [];
      if (metadataImagenes) {
        try {
          metadata = JSON.parse(metadataImagenes);
          console.log('📋 Metadata parseada:', metadata);
        } catch (e) {
          console.warn('⚠️ Error parseando metadata de imágenes:', e);
        }
      }

      console.log('☁️ Iniciando subida de imágenes a ImgBB...');
      
      // Subir imágenes a ImgBB
      const uploadPromises = files.map(async (file, index) => {
        console.log(`📁 Procesando archivo ${index + 1}/${files.length}:`, file.originalname);
        const fileName = `momento_destacado_${Date.now()}_${index}.${file.originalname.split('.').pop()}`;
        
        console.log(`☁️ Subiendo ${fileName} a ImgBB...`);
        const uploadResult = await uploadToImgBB(file.buffer, fileName);
        
        if (!uploadResult.success) {
          console.log(`❌ Error subiendo ${fileName}:`, uploadResult.error);
          throw new Error(`Error subiendo imagen ${file.originalname}: ${uploadResult.error}`);
        }

        console.log(`✅ ${fileName} subido exitosamente. URL:`, uploadResult.data.url);
        
        const imagenMetadata = metadata[index] || {};
        
        const nuevaImagen = await MomentosDestacadosImage.create({
          idConfig: config.idConfig,
          url: uploadResult.data.url,
          titulo: imagenMetadata.titulo || `Momento ${index + 1}`,
          descripcion: imagenMetadata.descripcion || null,
          alt: imagenMetadata.alt || `Momento destacado ${index + 1}`,
          orden: imagenesActuales + index + 1,
          activo: true
        });

        console.log(`💾 Imagen guardada en DB con ID:`, nuevaImagen.idImagen);
        return nuevaImagen;
      });

      await Promise.all(uploadPromises);
      console.log('✅ Todas las imágenes procesadas exitosamente');
    } else {
      console.log('ℹ️ No hay archivos para procesar');
    }

    // Recargar configuración actualizada
    console.log('🔄 Recargando configuración actualizada...');
    const configActualizada = await MomentosDestacadosConfig.findByPk(config.idConfig, {
      include: [{
        model: MomentosDestacadosImage,
        as: 'imagenes',
        where: { activo: true },
        required: false,
        order: [['orden', 'ASC']]
      }]
    });

    console.log('📊 Configuración final - Imágenes cargadas:', configActualizada.imagenes?.length || 0);
    console.log('🎉 === DEBUG: Fin exitoso de updateMomentosDestacadosConfig ===');

    res.status(200).json({
      status: '1',
      msg: 'Configuración de momentos destacados actualizada exitosamente',
      data: configActualizada
    });

  } catch (error) {
    console.error('💥 === DEBUG: Error en updateMomentosDestacadosConfig ===');
    console.error('❌ Error completo:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({
      status: '0',
      msg: 'Error interno del servidor',
      error: error.message
    });
  }
};

/**
 * Eliminar imagen de momentos destacados
 */
const deleteMomentoDestacadoImage = async (req, res) => {
  try {
    const { id } = req.params;

    const imagen = await MomentosDestacadosImage.findByPk(id);
    if (!imagen) {
      return res.status(404).json({
        status: '0',
        msg: 'Imagen no encontrada'
      });
    }

    await imagen.update({ activo: false });

    res.status(200).json({
      status: '1',
      msg: 'Imagen eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando imagen de momento destacado:', error);
    res.status(500).json({
      status: '0',
      msg: 'Error interno del servidor',
      error: error.message
    });
  }
};

/**
 * Reordenar imágenes de momentos destacados
 */
const reorderImages = async (req, res) => {
  try {
    const { imageOrders } = req.body;

    if (!imageOrders || !Array.isArray(imageOrders)) {
      return res.status(400).json({
        status: '0',
        msg: 'Array de órdenes de imágenes requerido'
      });
    }

    // Actualizar orden de cada imagen
    const updatePromises = imageOrders.map(({ idImagen, orden }) =>
      MomentosDestacadosImage.update(
        { orden },
        { where: { idImagen, activo: true } }
      )
    );

    await Promise.all(updatePromises);

    res.status(200).json({
      status: '1',
      msg: 'Orden de imágenes actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error reordenando imágenes de momentos destacados:', error);
    res.status(500).json({
      status: '0',
      msg: 'Error interno del servidor',
      error: error.message
    });
  }
};

module.exports = {
  getMomentosDestacadosConfig,
  updateMomentosDestacadosConfig,
  deleteMomentoDestacadoImage,
  reorderImages
}; 