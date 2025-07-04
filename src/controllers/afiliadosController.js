const Persona = require('../models/Persona');
const Club = require('../models/Club');
const Pase = require('../models/Pase');
const Pago = require('../models/Pago');
const Cobro = require('../models/Cobro');
const Credencial = require('../models/Credencial');
const { Op, fn, col, literal } = require('sequelize');
const ExcelJS = require('exceljs');

// Filtros avanzados para afiliados - Funcionalidad tipo Excel
const filtrarAfiliadosAvanzado = async (req, res) => {
    try {
        console.log('=== DEBUG: Iniciando filtrarAfiliadosAvanzado ===');
        console.log('Query params:', req.query);
        
        const { 
            page = 1,
            limit = 50,
            apellidoNombre,
            dni,
            estadoLicencia
        } = req.query;

        // Construcción de filtros WHERE básicos
        const whereConditions = {};

        if (dni) {
            whereConditions.dni = { [Op.iLike]: `%${dni}%` };
        }
        
        if (apellidoNombre) {
            whereConditions.nombreApellido = { [Op.iLike]: `%${apellidoNombre}%` };
        }
        
        if (estadoLicencia) {
            whereConditions.estadoLicencia = estadoLicencia;
        }

        console.log('=== DEBUG: whereConditions ===', whereConditions);

        // Paginación
        const offset = (parseInt(page) - 1) * parseInt(limit);

        // Ejecutar consulta usando el mismo patrón que personas
        const { count, rows: afiliados } = await Persona.findAndCountAll({
            where: whereConditions,
            include: {
                model: Club,
                as: 'club',
                attributes: ['idClub', 'nombre'],
                required: false
            },
            limit: parseInt(limit),
            offset: offset,
            order: [['nombreApellido', 'ASC']],
            distinct: true
        });

        console.log('=== DEBUG: Consulta exitosa, count:', count, 'afiliados:', afiliados.length);

        // Estadísticas básicas
        const estadisticas = {
            totalAfiliados: count,
            afiliadosActivos: await Persona.count({ 
                where: { ...whereConditions, estadoLicencia: 'ACTIVO' }
            }),
            afiliadosInactivos: await Persona.count({ 
                where: { ...whereConditions, estadoLicencia: 'INACTIVO' }
            }),
            totalPases: 0,
            totalPagos: 0,
            porcentajeActivos: 0
        };

        console.log('=== DEBUG: Enviando respuesta ===');
        res.json({
            success: true,
            data: {
                afiliados,
                totalRegistros: count,
                paginaActual: parseInt(page),
                totalPaginas: Math.ceil(count / parseInt(limit)),
                registrosPorPagina: parseInt(limit),
                estadisticas
            }
        });

    } catch (error) {
        console.error('=== ERROR en filtrarAfiliadosAvanzado ===');
        console.error('Error completo:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Función para calcular estadísticas
const calcularEstadisticasAfiliados = async (whereConditions, includes) => {
    try {
        const [
            totalAfiliados,
            afiliadosActivos,
            afiliadosInactivos,
            totalClubes,
            totalPases,
            totalPagos
        ] = await Promise.all([
            Persona.count({ where: whereConditions, include: includes, distinct: true }),
            Persona.count({ 
                where: { ...whereConditions, estadoLicencia: 'ACTIVO' }, 
                include: includes, 
                distinct: true 
            }),
            Persona.count({ 
                where: { ...whereConditions, estadoLicencia: 'INACTIVO' }, 
                include: includes, 
                distinct: true 
            }),
            Persona.count({
                where: whereConditions,
                include: includes,
                distinct: true,
                col: 'idClub'
            }),
            Pase.count(),
            Pago.count()
        ]);

        return {
            totalAfiliados,
            afiliadosActivos,
            afiliadosInactivos,
            totalClubes,
            totalPases,
            totalPagos,
            porcentajeActivos: totalAfiliados > 0 ? ((afiliadosActivos / totalAfiliados) * 100).toFixed(2) : 0
        };
    } catch (error) {
        console.error('Error calculando estadísticas:', error);
        return {};
    }
};

// Función para exportar a Excel
const exportarAfiliadosExcel = async (afiliados, res) => {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Afiliados Filtrados');

        // Definir columnas
        worksheet.columns = [
            { header: 'DNI', key: 'dni', width: 15 },
            { header: 'Nombre y Apellido', key: 'nombreApellido', width: 30 },
            { header: 'Fecha Nacimiento', key: 'fechaNacimiento', width: 15 },
            { header: 'Club Actual', key: 'clubNombre', width: 25 },
            { header: 'Estado Licencia', key: 'estadoLicencia', width: 15 },
            { header: 'Fecha Licencia', key: 'fechaLicencia', width: 15 },
            { header: 'Tipo', key: 'tipo', width: 20 },
            { header: 'Categoría', key: 'categoria', width: 15 },
            { header: 'Nivel Categoría', key: 'categoriaNivel', width: 15 },
            { header: 'Número Afiliación', key: 'numeroAfiliacion', width: 15 },
            { header: 'Total Pases', key: 'totalPases', width: 12 },
            { header: 'Total Credenciales', key: 'totalCredenciales', width: 15 }
        ];

        // Agregar datos
        afiliados.forEach(afiliado => {
            worksheet.addRow({
                dni: afiliado.dni,
                nombreApellido: afiliado.nombreApellido,
                fechaNacimiento: afiliado.fechaNacimiento,
                clubNombre: afiliado.club?.nombre || 'Sin club',
                estadoLicencia: afiliado.estadoLicencia,
                fechaLicencia: afiliado.fechaLicencia,
                tipo: afiliado.tipo?.join(', ') || '',
                categoria: afiliado.categoria,
                categoriaNivel: afiliado.categoriaNivel,
                numeroAfiliacion: afiliado.numeroAfiliacion,
                totalPases: afiliado.pases?.length || 0,
                totalCredenciales: afiliado.credenciales?.length || 0
            });
        });

        // Estilo del encabezado
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4472C4' }
        };

        // Configurar respuesta
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=afiliados_filtrados_${new Date().toISOString().split('T')[0]}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Error exportando a Excel:', error);
        throw error;
    }
};

// Obtener opciones para filtros (valores únicos)
const obtenerOpcionesFiltros = async (req, res) => {
    try {
        console.log('=== DEBUG: obtenerOpcionesFiltros ===');
        
        // Obtener clubes
        const clubes = await Club.findAll({ 
            attributes: ['idClub', 'nombre'],
            order: [['nombre', 'ASC']]
        });

        // Opciones básicas estáticas
        const estadosLicencia = ['ACTIVO', 'INACTIVO', 'PENDIENTE', 'SUSPENDIDO'];
        const tipos = ['Jugador', 'Entrenador', 'Dirigente', 'Árbitro', 'Técnico'];
        const categorias = ['Infantil', 'Cadete', 'Juvenil', 'Mayor', 'Veterano'];
        const categoriasNivel = ['A', 'B', 'C'];
        const estadosPago = ['Pendiente', 'Pagado', 'Rechazado', 'Anulado'];

        console.log('=== DEBUG: Enviando opciones ===');
        res.json({
            success: true,
            data: {
                clubes,
                estadosLicencia,
                tipos,
                categorias,
                categoriasNivel,
                estadosPago
            }
        });

    } catch (error) {
        console.error('=== ERROR en obtenerOpcionesFiltros ===');
        console.error('Error completo:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo opciones de filtros',
            error: error.message
        });
    }
};

// Guardar configuración de filtros
const guardarConfiguracionFiltro = async (req, res) => {
    try {
        console.log('=== DEBUG: guardarConfiguracionFiltro ===');
        const { nombre, descripcion, filtros, usuarioId } = req.body;

        // Por ahora, devolvemos la configuración tal como se envió
        // En el futuro se puede implementar persistencia en BD
        
        res.json({
            success: true,
            message: 'Configuración guardada exitosamente',
            data: {
                id: Date.now(), // ID temporal
                nombre,
                descripcion,
                filtros,
                usuarioId,
                fechaCreacion: new Date()
            }
        });

    } catch (error) {
        console.error('=== ERROR en guardarConfiguracionFiltro ===');
        console.error('Error completo:', error);
        res.status(500).json({
            success: false,
            message: 'Error guardando configuración',
            error: error.message
        });
    }
};

module.exports = {
    filtrarAfiliadosAvanzado,
    obtenerOpcionesFiltros,
    guardarConfiguracionFiltro,
    exportarAfiliadosExcel,
    calcularEstadisticasAfiliados
}; 