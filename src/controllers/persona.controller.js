const Persona = require("../models/Persona");
const Club = require("../models/Club"); 
const { Op } = require("sequelize");
const { sequelize } = require('../config/database');

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

    // Opcional: Validar que el Club exista si se proporciona idClub
    if (personaData.idClub) {
      const clubExistente = await Club.findByPk(personaData.idClub);
      if (!clubExistente) {
        return res.status(400).json({
          status: "0",
          msg: `El Club con ID ${personaData.idClub} no existe.`,
        });
      }
    }

    console.log('📋 Datos finales a actualizar:', personaData);

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
    #swagger.parameters['nombreApellido'] = { in: 'query', description: 'Filtra por nombre o apellido de la persona.', type: 'string' }
    #swagger.parameters['dni'] = { in: 'query', description: 'Filtra por DNI de la persona.', type: 'string' }
    #swagger.parameters['tipo'] = { in: 'query', description: 'Filtra por el tipo de persona (ej. Jugador, Entrenador).', type: 'string' }
    #swagger.parameters['categoria'] = { in: 'query', description: 'Filtra por la categoría de la persona.', type: 'string' }
    #swagger.parameters['fechaNacimientoDesde'] = { in: 'query', description: 'Filtra por fecha de nacimiento desde (YYYY-MM-DD).', type: 'string' }
    #swagger.parameters['fechaNacimientoHasta'] = { in: 'query', description: 'Filtra por fecha de nacimiento hasta (YYYY-MM-DD).', type: 'string' }
    #swagger.parameters['fechaLicenciaDesde'] = { in: 'query', description: 'Filtra por fecha de licencia desde (YYYY-MM-DD).', type: 'string' }
    #swagger.parameters['fechaLicenciaHasta'] = { in: 'query', description: 'Filtra por fecha de licencia hasta (YYYY-MM-DD).', type: 'string' }
    #swagger.parameters['idClub'] = { in: 'query', description: 'Filtra por ID del Club asociado.', type: 'integer' }
    */
  const query = req.query;
  const criteria = {};

  if (query.nombreApellido) {
    criteria.nombreApellido = { [Op.iLike]: `%${query.nombreApellido}%` };
  }
  if (query.dni) {
    criteria.dni = { [Op.iLike]: `%${query.dni}%` };
  }
  if (query.tipo) {
    criteria.tipo = { [Op.contains]: [query.tipo] };
  }
  if (query.categoria) {
    criteria.categoria = { [Op.iLike]: `%${query.categoria}%` };
  }
  if (query.idClub) {
    criteria.idClub = query.idClub; 
  }

  // Filtros de rango de fechas
  if (query.fechaNacimientoDesde || query.fechaNacimientoHasta) {
    criteria.fechaNacimiento = {};
    if (query.fechaNacimientoDesde) {
      criteria.fechaNacimiento[Op.gte] = query.fechaNacimientoDesde;
    }
    if (query.fechaNacimientoHasta) {
      criteria.fechaNacimiento[Op.lte] = query.fechaNacimientoHasta;
    }
  }

  if (query.fechaLicenciaDesde || query.fechaLicenciaHasta) {
    criteria.fechaLicencia = {};
    if (query.fechaLicenciaDesde) {
      criteria.fechaLicencia[Op.gte] = query.fechaLicenciaDesde;
    }
    if (query.fechaLicenciaHasta) {
      criteria.fechaLicencia[Op.lte] = query.fechaLicenciaHasta;
    }
  }

  try {
    const personas = await Persona.findAll({
      where: criteria,
      include: {
        // Incluye el club asociado si se filtra por club o simplemente quieres verlo
        model: Club,
        as: "club",
        attributes: ["idClub", "nombre"],
      },
    });
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
