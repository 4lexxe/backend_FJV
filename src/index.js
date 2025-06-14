/**
 * Punto de entrada principal de la aplicación
 * 
 * Configura Express, carga middlewares y rutas, y arranca el servidor
 */

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
require('dotenv').config(); 

// Importar configuraciones y modelos
const { sequelize, connectDB } = require('./config/database');
const passport = require('./config/passport');
const defineAssociations = require('./models/associations');

// --- Inicialización de Express ---
const app = express();

// === MIDDLEWARES ===
// Parseo de JSON y URL encoded
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// CORS
app.use(cors({ 
    origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
    credentials: true
}));

// Sesiones para autenticación
app.use(session({
    secret: process.env.JWT_SECRET || 'tu_clave_secreta_jwt',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
}));

// Passport para autenticación
app.use(passport.initialize());
app.use(passport.session());

// Puerto
app.set('port', process.env.PORT || 3000);

// === RUTAS ===
// La API base
app.get('/', (req, res) => {
    res.json({
        name: 'API de la Federación Jujeña de Voley',
        version: '1.0.0',
        status: 'OK'
    });
});

// Importante: asegurar que las rutas de autenticación se carguen primero
app.use('/api/auth', require('./routes/auth.routes'));

// Resto de rutas de la API
app.use('/api/usuario', require('./routes/usuario.routes'));
app.use('/api/rol', require('./routes/rol.routes'));
app.use('/api/personas', require('./routes/persona.routes')); 
app.use('/api/clubs', require('./routes/club.routes'));
app.use('/api/categorias', require('./routes/categoria.routes'));
app.use('/api/equipos', require('./routes/equipo.routes'));

// Middleware para manejo de errores 404 - DEBE SER EL ÚLTIMO
app.use((req, res, next) => {
    console.log(`Ruta no encontrada: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada',
        path: req.originalUrl
    });
});

// === INICIAR SERVIDOR ===
async function startServer() {
    try {
        // 1. Conectar a la base de datos
        await connectDB();
        console.log('✔ Conexión a la base de datos establecida correctamente.');
        
        // 2. Definir asociaciones entre modelos
        defineAssociations();
        
        // 3. Sincronizar modelos con la base de datos
        await sequelize.sync({ force: false });
        console.log("✔ Todos los modelos fueron sincronizados exitosamente con la base de datos.");
        
        // 4. Inicializar datos iniciales si es necesario (roles por defecto, etc.)
        await initializeDefaultData();
        
        // 5. Inicializar usuario administrador si no existe
        await initializeAdminUser();
        
        // 6. Iniciar el servidor HTTP
        app.listen(app.get('port'), () => {
            console.log(`🚀 Servidor backend escuchando en http://localhost:${app.get('port')}`);
        });
    } catch (error) {
        console.error('❌ Error al iniciar el servidor:', error);
        process.exit(1);
    }
}

/**
 * Inicializa datos por defecto necesarios para el funcionamiento del sistema
 */
async function initializeDefaultData() {
    try {
        const Rol = require('./models/Rol');
        
        // Verificar si ya existen roles
        const rolesCount = await Rol.count();
        
        if (rolesCount === 0) {
            console.log('Creando roles predeterminados...');
            
            // Crear roles básicos
            await Rol.bulkCreate([
                { nombre: 'admin', descripcion: 'Administrador del sistema' },
                { nombre: 'usuario', descripcion: 'Usuario regular' },
                { nombre: 'usuario_social', descripcion: 'Usuario de redes sociales' }
            ]);
            
            console.log('✓ Roles predeterminados creados correctamente');
        } else {
            console.log(`✓ Ya existen ${rolesCount} roles en el sistema`);
        }
    } catch (error) {
        console.error('Error al inicializar datos predeterminados:', error);
        throw error; // Propagar error para que se maneje en startServer
    }
}

/**
 * Inicializa un usuario administrador si no existe
 */
async function initializeAdminUser() {
    try {
        const Rol = require('./models/Rol');
        const Usuario = require('./models/Usuario');
        
        // Buscar rol de administrador
        let adminRol = await Rol.findOne({ where: { nombre: 'admin' } });
        
        // Si no existe el rol admin, salir (debería haberse creado en initializeDefaultData)
        if (!adminRol) {
            console.error('❌ No se encontró el rol de administrador. No se pudo crear usuario admin.');
            return;
        }
        
        // Verificar si existe algún usuario con rol admin
        const adminExists = await Usuario.findOne({
            where: { rolId: adminRol.id }
        });
        
        if (adminExists) {
            console.log('✓ Usuario administrador ya existe:', adminExists.email);
            return;
        }
        
        // Datos del administrador por defecto
        const adminUser = await Usuario.create({
            nombre: 'Admin',
            apellido: 'Sistema',
            email: 'admin@sistema.com',
            password: 'Admin123!', // Se hasheará automáticamente por el hook de beforeCreate
            rolId: adminRol.id,
            emailVerificado: true
        });
        
        console.log('✅ Usuario administrador creado exitosamente:');
        console.log(`   - Email: ${adminUser.email}`);
        console.log(`   - Contraseña: Admin123!`);
        console.log('⚠️  IMPORTANTE: Cambie la contraseña después del primer inicio de sesión');
        
    } catch (error) {
        console.error('❌ Error al inicializar usuario administrador:', error);
    }
}

// Iniciar el servidor
startServer();
