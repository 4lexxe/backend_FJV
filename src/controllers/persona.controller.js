const Persona = require("../models/Persona");
const Club = require("../models/Club"); 
const { Op } = require("sequelize");
const { sequelize } = require('../config/database');
const paseCtrl = require('./pase.controller');

const personaCtrl = {};

personaCtrl.getPersonas = async (req, res) => {
  /*
    #swagger.tags = ['Personas']
    #swagger.summary = 'Obtener todas las Personas'
    #swagger.description = 'Retorna una lista de todas las personas registradas, incluyendo su club asociado.'
    */
  try {
    const personas = await Persona.findAll({
      include: {
        model: Club,
        as: "club", 
        attributes: ["idClub", "nombre"], 
      },
    });
    res.status(200).json(personas);
  } catch (error) {
    console.error("Error en getPersonas:", error);
    res.status(500).json({
      status: "0",
      msg: "Error procesando la operación.",
      error: error.message,
    });
  }
};

personaCtrl.createPersona = async (req, res) => {
  /*
    #swagger.tags = ['Personas']
    #swagger.summary = 'Crear una nueva Persona'
    #swagger.description = 'Agrega una nueva persona a la base de datos. Puede incluir idClub para asociarla a un club existente.'
    #swagger.parameters['body'] = {
        in: 'body',
        description: 'Datos de la persona a crear.',
        required: true,
        schema: { $ref: '#/definitions/Persona' } // Asumiendo que has definido 'Persona' en tus definiciones de Swagger
    }
    */
  try {
    console.log("Creando nueva persona con datos:", req.body);

    // A estas alturas, si había una foto, el middleware ya la procesó
    // y la URL de la imagen está en req.body.foto

    const personaData = { ...req.body };

    // Procesar el campo 'tipo' para asegurar que sea un array
    if (personaData.tipo) {
      if (typeof personaData.tipo === 'string') {
        // Si es un string con comas, dividirlo. Si es un string simple, ponerlo en array
        personaData.tipo = personaData.tipo.includes(',') 
          ? personaData.tipo.split(',').map(t => t.trim()) 
          : [personaData.tipo];
        console.log('🔄 Campo tipo convertido de string a array:', personaData.tipo);
      } else if (!Array.isArray(personaData.tipo)) {
        // Si no es string ni array, convertir a array vacío
        personaData.tipo = [];
        console.log('⚠️ Campo tipo no válido, convertido a array vacío');
      }
    }

    // Validar fechas vacías o inválidas
    if (!personaData.fechaLicencia || personaData.fechaLicencia === 'Invalid date' || personaData.fechaLicencia === '') {
      personaData.fechaLicencia = null;
    }
    
    if (!personaData.fechaLicenciaBaja || personaData.fechaLicenciaBaja === 'Invalid date' || personaData.fechaLicenciaBaja === '') {
      personaData.fechaLicenciaBaja = null;
    }

    if (!personaData.fechaNacimiento || personaData.fechaNacimiento === 'Invalid date' || personaData.fechaNacimiento === '') {
      personaData.fechaNacimiento = null;
    }

    console.log('📋 Datos finales a crear:', personaData);

    // Crear persona con los datos procesados (incluida la foto ya procesada)
    const persona = await Persona.create(personaData);

    res.status(201).json({
      status: "1",
      msg: "Persona registrada con éxito",
      persona,
    });
  } catch (error) {
    console.error("Error en createPersona:", error);

    // Manejo específico de errores de validación
    if (
      error.name === "SequelizeValidationError" ||
      error.name === "SequelizeUniqueConstraintError"
    ) {
      return res.status(400).json({
        status: "0",
        msg: "Error de validación",
        errors: error.errors.map((e) => ({
          field: e.path,
          message: e.message,
        })),
      });
    }

    res.status(500).json({
      status: "0",
      msg: "Error al guardar persona",
      error: error.message,
    });
  }
};

personaCtrl.getPersona = async (req, res) => {
  /*
    #swagger.tags = ['Personas']
    #swagger.summary = 'Obtener Persona por ID'
    #swagger.description = 'Retorna una persona específica usando su ID, incluyendo su club asociado.'
    */
  try {
    const persona = await Persona.findByPk(req.params.id, {
      include: {
        model: Club,
        as: "club",
        attributes: ["idClub", "nombre"],
      },
    });

    if (!persona) {
      return res.status(404).json({
        status: "0",
        msg: "Persona no encontrada.",
      });
    }
    res.status(200).json(persona);
  } catch (error) {
    console.error("Error en getPersona:", error);
    res.status(500).json({
      status: "0",
      msg: "Error procesando la operación.",
      error: error.message,
    });
  }
};

personaCtrl.editPersona = async (req, res) => {
  /*
    #swagger.tags = ['Personas']
    #swagger.summary = 'Actualizar una Persona'
    #swagger.description = 'Actualiza la información de una persona existente usando su ID. Permite modificar idClub para reasignar a un club.'
    #swagger.parameters['body'] = {
        in: 'body',
        description: 'Datos de la persona a actualizar.',
        required: true,
        schema: { $ref: '#/definitions/Persona' }
    }
    */
  try {
    console.log("Editando persona ID:", req.params.id, "con datos:", req.body);

    // Obtener datos actuales de la persona ANTES de la actualización
    const personaAnterior = await Persona.findByPk(req.params.id, {
      include: {
        model: Club,
        as: "club",
        attributes: ["idClub", "nombre"]
      }
    });

    if (!personaAnterior) {
      return res.status(404).json({
        status: "0",
        msg: "Persona no encontrada para actualizar.",
      });
    }

    // A estas alturas, si había una foto, el middleware ya la procesó
    // y la URL de la imagen está en req.body.foto

    const personaData = { ...req.body }; 

    // Procesar el campo 'tipo' para asegurar que sea un array
    if (personaData.tipo) {
      if (typeof personaData.tipo === 'string') {
        // Si es un string con comas, dividirlo. Si es un string simple, ponerlo en array
        personaData.tipo = personaData.tipo.includes(',') 
          ? personaData.tipo.split(',').map(t => t.trim()) 
          : [personaData.tipo];
        console.log('🔄 Campo tipo convertido de string a array:', personaData.tipo);
      } else if (!Array.isArray(personaData.tipo)) {
        // Si no es string ni array, convertir a array vacío
        personaData.tipo = [];
        console.log('⚠️ Campo tipo no válido, convertido a array vacío');
      }
    }

    // Obtener información del club nuevo si se proporciona
    let clubNuevo = null;
    if (personaData.idClub) {
      clubNuevo = await Club.findByPk(personaData.idClub);
      if (!clubNuevo) {
        return res.status(400).json({
          status: "0",
          msg: `El Club con ID ${personaData.idClub} no existe.`,
        });
      }
    }

    console.log('📋 Datos finales a actualizar:', personaData);

    // Verificar si hay cambio de club
    const idClubAnterior = personaAnterior.idClub;
    const idClubNuevo = personaData.idClub;
    const hayCambioDeClub = idClubAnterior !== idClubNuevo;

    console.log('🔄 Verificando cambio de club:', {
      idClubAnterior,
      idClubNuevo,
      hayCambioDeClub
    });

    // Actualizar la persona
    const [updatedRowsCount, updatedPersonas] = await Persona.update(
      personaData,
      {
        where: { idPersona: req.params.id }, 
        returning: true, 
      }
    );

    if (updatedRowsCount === 0) {
      return res.status(404).json({
        status: "0",
        msg: "Persona no encontrada para actualizar.",
      });
    }

    // Si hay cambio de club, registrar el pase automáticamente
    if (hayCambioDeClub) {
      try {
        const clubAnteriorNombre = personaAnterior.club ? personaAnterior.club.nombre : null;
        const clubNuevoNombre = clubNuevo ? clubNuevo.nombre : null;

        // Preparar datos del afiliado para el historial
        const datosAfiliado = {
          categoria: personaData.categoria || personaAnterior.categoria,
          categoriaNivel: personaData.categoriaNivel || personaAnterior.categoriaNivel,
          tipo: personaData.tipo || personaAnterior.tipo,
          licencia: personaData.licencia || personaAnterior.licencia,
          fechaActualizacion: new Date().toISOString()
        };

        // Registrar el pase automáticamente
        await paseCtrl.registrarPaseAutomatico(
          parseInt(req.params.id),
          clubAnteriorNombre,
          idClubAnterior,
          clubNuevoNombre,
          idClubNuevo,
          datosAfiliado
        );

        console.log(`✅ Pase registrado automáticamente para persona ${req.params.id}: ${clubAnteriorNombre || 'Sin club'} → ${clubNuevoNombre || 'Sin club'}`);
      } catch (paseError) {
        console.error('❌ Error al registrar pase automático:', paseError);
        // No fallar la actualización de la persona por un error en el pase
        // Solo logear el error
      }
    }

    res.status(200).json({
      status: "1",
      msg: "Persona actualizada.",
      persona: updatedPersonas[0],
    });
  } catch (error) {
    console.error("Error en editPersona:", error);
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        status: "0",
        msg: "El DNI o la Licencia FEVA/FJA ya están registrados en otra persona.",
        error: error.message,
      });
    }
    res.status(400).json({
      status: "0",
      msg: "Error procesando la operación.",
      error: error.message,
    });
  }
};

personaCtrl.deletePersona = async (req, res) => {
  /*
    #swagger.tags = ['Personas']
    #swagger.summary = 'Eliminar una Persona'
    #swagger.description = 'Elimina una persona de la base de datos usando su ID.'
    */
  try {
    const deletedRows = await Persona.destroy({
      where: { idPersona: req.params.id }, 
    });

    if (deletedRows === 0) {
      return res.status(404).json({
        status: "0",
        msg: "Persona no encontrada para eliminar.",
      });
    }

    res.status(200).json({
      status: "1",
      msg: "Persona eliminada.",
    });
  } catch (error) {
    console.error("Error en deletePersona:", error);
    if (error.name === "SequelizeForeignKeyConstraintError") {
      return res.status(400).json({
        status: "0",
        msg: "No se puede eliminar la persona porque está asociada a otros registros (ej. un usuario, si hubiese más tablas que referencian a persona) o no tiene configurada la eliminación en cascada.",
        error: error.message,
      });
    }
    res.status(400).json({
      status: "0",
      msg: "Error procesando la operación.",
      error: error.message,
    });
  }
};

personaCtrl.getPersonaFiltro = async (req, res) => {
  /*
    #swagger.tags = ['Personas']
    #swagger.summary = 'Filtrar Personas'
    #swagger.description = 'Retorna personas que coinciden con los criterios de filtro (nombreApellido, dni, tipo, categoria, fechaNacimiento, fechaLicencia, idClub).'
    */
  const query = req.query;
  const criteria = {};

  // Corregir el filtro por nombre/apellido
  if (query.nombreApellido || query.apellidoNombre) {
    // Usar el parámetro que venga en la solicitud (nombreApellido o apellidoNombre)
    const terminoBusqueda = query.nombreApellido || query.apellidoNombre;
    criteria.nombreApellido = { [Op.iLike]: `%${terminoBusqueda}%` };
    console.log(`🔍 Buscando por nombre/apellido: "${terminoBusqueda}"`);
  }

  if (query.dni) {
    criteria.dni = { [Op.iLike]: `%${query.dni}%` };
  }
  
  // Mejorar el manejo del campo tipo cuando viene como string separado por comas
  if (query.tipo) {
    let tipoArray;
    if (typeof query.tipo === 'string') {
      // Si es un string con comas, dividirlo en array
      tipoArray = query.tipo.split(',').map(t => t.trim());
    } else if (Array.isArray(query.tipo)) {
      tipoArray = query.tipo;
    } else {
      tipoArray = [query.tipo];
    }
    
    // Usar el operador de array correcto en Sequelize
    criteria.tipo = {
      [Op.overlap]: tipoArray
    };
    
    console.log('Criterio de tipo aplicado:', criteria.tipo);
  }
  
  if (query.categoria) {
    criteria.categoria = { [Op.iLike]: `%${query.categoria}%` };
  }
  
  if (query.categoriaNivel) {
    criteria.categoriaNivel = { [Op.iLike]: `%${query.categoriaNivel}%` };
  }
  
  // Filtro específico para clubes
  if (query.clubId) {
    // Filtrar por club específico
    criteria.idClub = query.clubId;
    console.log(`🔍 Filtrando por club ID: ${query.clubId}`);
  } else if (query.clubNombre) {
    // Buscar clubes por nombre y obtener sus IDs
    const clubes = await Club.findAll({
      where: {
        nombre: { [Op.iLike]: `%${query.clubNombre}%` }
      },
      attributes: ['idClub']
    });
    
    if (clubes && clubes.length > 0) {
      const clubIds = clubes.map(c => c.idClub);
      criteria.idClub = { [Op.in]: clubIds };
      console.log(`🔍 Filtrando por clubes con nombre similar a "${query.clubNombre}":`, clubIds);
    }
  } else if (query.soloConClub === 'true') {
    // Solo mostrar afiliados que tienen club asignado
    criteria.idClub = { [Op.not]: null };
    console.log('🔍 Filtrando solo afiliados con club asignado');
  }

  // Filtro específico para pases
  if (query.tienePases === 'true') {
    // Este filtro necesitaría una consulta más compleja con joins
    // Por ahora, haremos un filtro simple para verificar si tiene clubDestino
    criteria.paseClub = { [Op.not]: null };
    console.log('🔍 Filtrando afiliados que tienen pases');
  }

  if (query.clubOrigenId) {
    // Esta consulta requeriría join con la tabla de pases
    // Por ahora implementamos una lógica básica
    console.log(`🔍 Filtro por club origen ID: ${query.clubOrigenId} (requiere implementación de joins)`);
  }
  
  if (query.clubDestinoId) {
    criteria.paseClub = query.clubDestinoId;
    console.log(`🔍 Filtrando por club destino ID: ${query.clubDestinoId}`);
  }

  if (query.estadoPase) {
    // Implementación básica del filtro por estado de pase
    // Para una implementación completa, necesitaríamos unir con la tabla de pases
    console.log(`🔍 Filtro por estado de pase: ${query.estadoPase} (requiere implementación de joins)`);
  }

  // Filtros de rango de fechas de nacimiento
  if (query.fechaNacimientoDesde || query.fechaNacimientoHasta) {
    criteria.fechaNacimiento = {};
    if (query.fechaNacimientoDesde) {
      criteria.fechaNacimiento[Op.gte] = query.fechaNacimientoDesde;
    }
    if (query.fechaNacimientoHasta) {
      criteria.fechaNacimiento[Op.lte] = query.fechaNacimientoHasta;
    }
  }

  // Filtros por edad (calculando fechas basadas en la edad)
  if (query.edadDesde || query.edadHasta) {
    const hoy = new Date();
    const añoActual = hoy.getFullYear();

    if (!criteria.fechaNacimiento) {
      criteria.fechaNacimiento = {};
    }

    if (query.edadHasta) {
      // Para edad hasta 30, la fecha de nacimiento debe ser mayor o igual que (año actual - 30, mismo mes y día)
      // Es decir, la persona nació hace 30 años o menos
      const fechaHasta = new Date(añoActual - parseInt(query.edadHasta) - 1, hoy.getMonth(), hoy.getDate());
      criteria.fechaNacimiento[Op.gte] = fechaHasta.toISOString().split('T')[0];
    }

    if (query.edadDesde) {
      // Para edad desde 20, la fecha de nacimiento debe ser menor o igual que (año actual - 20, mismo mes y día)
      // Es decir, la persona nació hace 20 años o más
      const fechaDesde = new Date(añoActual - parseInt(query.edadDesde), hoy.getMonth(), hoy.getDate());
      criteria.fechaNacimiento[Op.lte] = fechaDesde.toISOString().split('T')[0];
    }
  }

  // Filtros de rango de fechas de licencia
  if (query.fechaLicenciaDesde || query.fechaLicenciaHasta) {
    criteria.fechaLicencia = {};
    if (query.fechaLicenciaDesde) {
      criteria.fechaLicencia[Op.gte] = query.fechaLicenciaDesde;
    }
    if (query.fechaLicenciaHasta) {
      criteria.fechaLicencia[Op.lte] = query.fechaLicenciaHasta;
    }
  }
  
  // Filtro por estado de licencia
  if (query.estadoLicencia) {
    criteria.estadoLicencia = query.estadoLicencia;
  }

  // Filtro para credenciales
  const includeOptions = [{
    model: Club,
    as: "club",
    attributes: ["idClub", "nombre"],
  }];

  // Si hay filtro por credenciales, debemos unir con la tabla de credenciales
  const tieneCredencial = query.tieneCredencial === 'true';
  const estadoCredencial = query.estadoCredencial;
  
  if (tieneCredencial || estadoCredencial) {
    try {
      const { models } = require('../models');
      const Credencial = models.Credencial; // Asumiendo que tienes un modelo Credencial definido
      
      // Si el modelo existe, agregarlo al include
      if (Credencial) {
        includeOptions.push({
          model: Credencial,
          as: "credenciales", // Ajustar según la relación definida en tus modelos
          required: tieneCredencial, // INNER JOIN si tieneCredencial=true
          where: estadoCredencial ? { estado: estadoCredencial } : undefined
        });
        
        console.log('✅ Join con tabla de credenciales agregado', {
          tieneCredencial,
          estadoCredencial
        });
      } else {
        console.warn('⚠️ No se encontró el modelo Credencial para el join');
      }
    } catch (error) {
      console.error('❌ Error al intentar incluir join con credenciales:', error.message);
      // Continuar sin el join en caso de error
    }
  }

  console.log('Criterios de búsqueda finales:', JSON.stringify(criteria, null, 2));

  try {
    // Opciones de ordenamiento
    const orderOptions = [];
    if (query.sortBy) {
      const direction = (query.sortOrder && query.sortOrder.toUpperCase() === 'DESC') ? 'DESC' : 'ASC';
      orderOptions.push([query.sortBy, direction]);
    }

    const personas = await Persona.findAll({
      where: criteria,
      include: includeOptions, // Usar el array de includes que puede tener credenciales
      order: orderOptions.length > 0 ? orderOptions : undefined,
      distinct: true // Para evitar duplicados cuando hay joins
    });
    
    console.log(`Encontrados ${personas.length} resultados con los filtros aplicados`);
    res.status(200).json(personas);
  } catch (error) {
    console.error("Error en getPersonaFiltro:", error);
    res.status(500).json({
      status: "0",
      msg: "Error procesando la operación.",
      error: error.message,
    });
  }
};

personaCtrl.getPersonaFoto = async (req, res) => {
  /*
    #swagger.tags = ['Personas']
    #swagger.summary = 'Obtener foto de Persona por ID'
    #swagger.description = 'Retorna la URL de la foto de una persona específica.'
    */
  try {
    const persona = await Persona.findByPk(req.params.id, {
      attributes: ["foto"],
    });

    if (!persona || !persona.foto) {
      return res.status(404).json({
        status: "0",
        msg: "La persona no tiene una foto de perfil.",
      });
    }

    res.status(200).json({
      status: "1",
      msg: "Foto obtenida correctamente.",
      foto: {
        fotoPerfilUrl: persona.foto,
      },
    });
  } catch (error) {
    console.error("Error en getPersonaFoto:", error);
    res.status(500).json({
      status: "0",
      msg: "Error procesando la operación.",
      error: error.message,
    });
  }
};

personaCtrl.renovarLicencia = async (req, res) => {
  /*
    #swagger.tags = ['Personas']
    #swagger.summary = 'Renovar la licencia de una Persona'
    #swagger.description = 'Extiende la fecha de vencimiento de la licencia de una persona por un año.'
    */
  try {
    const persona = await Persona.findByPk(req.params.id);

    if (!persona) {
      return res
        .status(404)
        .json({ status: "0", msg: "Persona no encontrada." });
    }

    const hoy = new Date();
    const fechaVencimiento = new Date();
    fechaVencimiento.setFullYear(hoy.getFullYear() + 1);

    await persona.update({
      fechaLicencia: hoy.toISOString().substring(0, 10),
      fechaLicenciaBaja: fechaVencimiento.toISOString().substring(0, 10),
      estadoLicencia: "ACTIVO",
    });

    const personaActualizada = await Persona.findByPk(req.params.id, {
      include: { model: Club, as: "club" },
    });

    res.status(200).json(personaActualizada);
  } catch (error) {
    console.error("Error en renovarLicencia:", error);
    res.status(500).json({
      status: "0",
      msg: "Error procesando la operación.",
      error: error.message,
    });
  }
};

personaCtrl.deleteFotoPerfil = async (req, res) => {
  /*
    #swagger.tags = ['Personas']
    #swagger.summary = 'Eliminar foto de perfil de una Persona'
    #swagger.description = 'Elimina la URL de la foto de una persona, estableciéndola a null.'
    */
  try {
    const persona = await Persona.findByPk(req.params.id);
    if (!persona) {
      return res
        .status(404)
        .json({ status: "0", msg: "Persona no encontrada." });
    }

    await persona.update({ foto: null });

    res.status(200).json({ status: "1", msg: "Foto de perfil eliminada." });
  } catch (error) {
    console.error("Error en deleteFotoPerfil:", error);
    res.status(500).json({
      status: "0",
      msg: "Error procesando la operación.",
      error: error.message,
    });
  }
};

personaCtrl.actualizarEstadoLicencias = async (req, res) => {
  /*
    #swagger.tags = ['Personas']
    #swagger.summary = 'Actualizar estados de todas las licencias'
    #swagger.description = 'Recorre todas las personas y actualiza su estado de licencia a "VENCIDO" si la fecha de baja ha pasado.'
    */
  try {
    const hoy = new Date();
    const [updatedCount] = await Persona.update(
      { estadoLicencia: "VENCIDO" },
      {
        where: {
          estadoLicencia: "ACTIVO",
          fechaLicenciaBaja: {
            [Op.lt]: hoy,
          },
        },
      }
    );

    res.status(200).json({
      status: "1",
      msg: `Operación completada. ${updatedCount} licencias actualizadas a "VENCIDO".`,
    });
  } catch (error) {
    console.error("Error en actualizarEstadoLicencias:", error);
    res.status(500).json({
      status: "0",
      msg: "Error procesando la operación.",
      error: error.message,
    });
  }
};

// --- Controladores de Estadísticas ---

personaCtrl.getResumen = async (req, res) => {
  /*
    #swagger.tags = ['Estadísticas']
    #swagger.summary = 'Obtener un resumen general'
    */
  try {
    const totalAfiliados = await Persona.count();
    const totalFJV = await Persona.count({ where: { licencia: "FJV" } });
    const totalFEVA = await Persona.count({ where: { licencia: "FEVA" } });

    res.status(200).json({
      totalAfiliados,
      totalFJV,
      totalFEVA,
    });
  } catch (error) {
    res
      .status(500)
      .json({ msg: "Error al obtener el resumen", error: error.message });
  }
};

personaCtrl.getCantidadPorCategoria = async (req, res) => {
  /*
    #swagger.tags = ['Estadísticas']
    #swagger.summary = 'Obtener cantidad de afiliados por tipo'
    */
  try {
    const cantidadPorTipo = await sequelize.query(
      `SELECT tipo_individual as tipo, COUNT(*) as cantidad
       FROM (SELECT unnest(tipo) as tipo_individual FROM personas WHERE tipo IS NOT NULL) as unnested_tipos
       GROUP BY tipo_individual
       ORDER BY cantidad DESC`,
      { type: sequelize.QueryTypes.SELECT }
    );
    res.status(200).json(cantidadPorTipo);
  } catch (error) {
    console.error("Error en getCantidadPorCategoria:", error);
    res.status(500).json({
      msg: "Error al obtener cantidad por tipo",
      error: error.message,
    });
  }
};

personaCtrl.getCantidadPorClub = async (req, res) => {
  /*
    #swagger.tags = ['Estadísticas']
    #swagger.summary = 'Obtener cantidad de afiliados por club'
    */
  try {
    const cantidadPorClub = await Persona.findAll({
      attributes: [
        [
          Persona.sequelize.fn(
            "COUNT",
            Persona.sequelize.col("Persona.idPersona")
          ),
          "cantidad",
        ],
      ],
      include: {
        model: Club,
        as: "club",
        attributes: ["nombre"],
      },
      group: ["club.idClub", "club.nombre"],
      order: [
        [
          Persona.sequelize.fn(
            "COUNT",
            Persona.sequelize.col("Persona.idPersona")
          ),
          "DESC",
        ],
      ],
    });

    // Formatear para que sea más amigable
    const resultado = cantidadPorClub.map((item) => ({
      club: item.club.nombre,
      cantidad: item.get("cantidad"),
    }));

    res.status(200).json(resultado);
  } catch (error) {
    res.status(500).json({
      msg: "Error al obtener cantidad por club",
      error: error.message,
    });
  }
};

// Obtener métricas avanzadas para gráficos
personaCtrl.getMetricasAvanzadas = async (req, res) => {
  /*
    #swagger.tags = ['Estadísticas']
    #swagger.summary = 'Obtener métricas avanzadas de afiliados'
    #swagger.description = 'Retorna métricas detalladas para gráficos y estadísticas del dashboard de afiliados.'
    */
  try {
    // Obtener todos los afiliados con sus clubes
    const afiliados = await Persona.findAll({
      include: {
        model: Club,
        as: "club",
        attributes: ["idClub", "nombre"],
      },
    });

    // Resumen general
    const totalAfiliados = afiliados.length;
    const totalFJV = afiliados.filter(a => a.licencia === 'FJV').length;
    const totalFEVA = afiliados.filter(a => a.licencia === 'FEVA').length;

    // Estadísticas por estado de licencia
    const activosCount = afiliados.filter(a => a.estadoLicencia === 'ACTIVO').length;
    const vencidosCount = afiliados.filter(a => a.estadoLicencia === 'VENCIDO').length;
    const inactivosCount = afiliados.filter(a => a.estadoLicencia === 'INACTIVO').length;

    // Distribución por tipo de licencia
    const distribucionLicencia = {
      FJV: totalFJV,
      FEVA: totalFEVA,
      SinLicencia: afiliados.filter(a => !a.licencia || a.licencia === '').length
    };

    // Distribución por club (top 10)
    const clubMap = new Map();
    afiliados.forEach(afiliado => {
      const clubName = afiliado.club?.nombre || 'Sin Club';
      if (!clubMap.has(clubName)) {
        clubMap.set(clubName, {
          nombre: clubName,
          total: 0,
          activos: 0,
          vencidos: 0,
          fjv: 0,
          feva: 0
        });
      }
      const club = clubMap.get(clubName);
      club.total += 1;
      
      if (afiliado.estadoLicencia === 'ACTIVO') club.activos += 1;
      else if (afiliado.estadoLicencia === 'VENCIDO') club.vencidos += 1;
      
      if (afiliado.licencia === 'FJV') club.fjv += 1;
      else if (afiliado.licencia === 'FEVA') club.feva += 1;
    });

    const distribucionPorClub = Array.from(clubMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 15); // Top 15 clubes

    // Distribución por categorías
    const categoriaMap = new Map();
    afiliados.forEach(afiliado => {
      if (afiliado.tipo && Array.isArray(afiliado.tipo)) {
        afiliado.tipo.forEach(categoria => {
          if (!categoriaMap.has(categoria)) {
            categoriaMap.set(categoria, 0);
          }
          categoriaMap.set(categoria, categoriaMap.get(categoria) + 1);
        });
      }
    });

    const distribucionPorCategoria = Array.from(categoriaMap.entries())
      .map(([categoria, cantidad]) => ({ categoria, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 10); // Top 10 categorías

    // Estadísticas mensuales de registros (últimos 12 meses)
    const ahora = new Date();
    const registrosMensuales = [];
    
    for (let i = 11; i >= 0; i--) {
      const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
      const siguienteFecha = new Date(ahora.getFullYear(), ahora.getMonth() - i + 1, 1);
      
      const registrosMes = afiliados.filter(a => {
        if (!a.createdAt) return false;
        const fechaCreacion = new Date(a.createdAt);
        return fechaCreacion >= fecha && fechaCreacion < siguienteFecha;
      });

      registrosMensuales.push({
        mes: fecha.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
        total: registrosMes.length,
        fjv: registrosMes.filter(a => a.licencia === 'FJV').length,
        feva: registrosMes.filter(a => a.licencia === 'FEVA').length
      });
    }

    // Análisis de vencimientos próximos (próximos 3 meses)
    const hoy = new Date();
    const enTresMeses = new Date(hoy.getFullYear(), hoy.getMonth() + 3, hoy.getDate());
    
    const proxVencimientos = afiliados.filter(a => {
      if (!a.fechaLicenciaBaja || a.estadoLicencia === 'VENCIDO') return false;
      const fechaVencimiento = new Date(a.fechaLicenciaBaja);
      return fechaVencimiento >= hoy && fechaVencimiento <= enTresMeses;
    }).length;

    const metricas = {
      resumen: {
        totalAfiliados,
        totalFJV,
        totalFEVA,
        activosCount,
        vencidosCount,
        inactivosCount,
        proxVencimientos,
        porcentajeActivos: totalAfiliados > 0 ? ((activosCount / totalAfiliados) * 100) : 0
      },
      distribucionLicencia,
      estadosLicencia: {
        Activos: activosCount,
        Vencidos: vencidosCount,
        Inactivos: inactivosCount
      },
      distribucionPorClub,
      distribucionPorCategoria,
      registrosMensuales,
      fechaActualizacion: new Date()
    };

    res.status(200).json(metricas);
  } catch (error) {
    console.error("Error en getMetricasAvanzadas:", error);
    res.status(500).json({
      status: "0",
      msg: "Error procesando las métricas",
      error: error.message
    });
  }
};

// Obtener estadísticas de crecimiento por período
personaCtrl.getEstadisticasCrecimiento = async (req, res) => {
  /*
    #swagger.tags = ['Estadísticas']
    #swagger.summary = 'Obtener estadísticas de crecimiento de afiliados'
    #swagger.description = 'Retorna estadísticas de crecimiento de afiliados por período específico.'
    */
  try {
    const { periodo = 'mes', fechaInicio, fechaFin } = req.query;
    
    let whereClause = {};
    
    if (fechaInicio && fechaFin) {
      whereClause.createdAt = {
        [Op.between]: [fechaInicio, fechaFin]
      };
    } else {
      // Por defecto, últimos 6 meses
      const fechaLimite = new Date();
      fechaLimite.setMonth(fechaLimite.getMonth() - 6);
      whereClause.createdAt = {
        [Op.gte]: fechaLimite
      };
    }

    const afiliados = await Persona.findAll({
      where: whereClause,
      include: {
        model: Club,
        as: "club",
        attributes: ["idClub", "nombre"],
      },
      order: [['createdAt', 'ASC']]
    });

    // Agrupar por período
    const estadisticas = {};
    
    afiliados.forEach(afiliado => {
      let clave;
      const fecha = new Date(afiliado.createdAt);
      
      if (periodo === 'dia') {
        clave = fecha.toISOString().split('T')[0];
      } else if (periodo === 'semana') {
        const inicioSemana = new Date(fecha);
        inicioSemana.setDate(fecha.getDate() - fecha.getDay());
        clave = inicioSemana.toISOString().split('T')[0];
      } else {
        clave = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      }
      
      if (!estadisticas[clave]) {
        estadisticas[clave] = {
          periodo: clave,
          totalNuevos: 0,
          nuevos_FJV: 0,
          nuevos_FEVA: 0,
          activos: 0
        };
      }
      
      estadisticas[clave].totalNuevos += 1;
      
      if (afiliado.licencia === 'FJV') {
        estadisticas[clave].nuevos_FJV += 1;
      } else if (afiliado.licencia === 'FEVA') {
        estadisticas[clave].nuevos_FEVA += 1;
      }
      
      if (afiliado.estadoLicencia === 'ACTIVO') {
        estadisticas[clave].activos += 1;
      }
    });

    const resultado = Object.values(estadisticas).sort((a, b) => 
      new Date(a.periodo) - new Date(b.periodo)
    );

    res.status(200).json({
      periodo,
      estadisticas: resultado,
      fechaActualizacion: new Date()
    });
  } catch (error) {
    console.error("Error en getEstadisticasCrecimiento:", error);
    res.status(500).json({
      status: "0",
      msg: "Error procesando las estadísticas",
      error: error.message
    });
  }
};

module.exports = personaCtrl;
