const express = require('express');
const cors = require('cors');
const session = require('express-session');
require('dotenv').config(); 

//Importar Sequelize y la función de conexión a la DB ---
const { sequelize, connectDB } = require('./config/database');
const passport = require('./config/passport');

//  Importar TODOS los modelos ---
const Rol = require('./models/Rol');
const Usuario = require('./models/Usuario');
const Club = require('./models/Club');
const Categoria = require('./models/Categoria');
const Equipo = require('./models/Equipo');
const Persona = require('./models/Persona');

// --- Asociaciones para Club ---
Club.hasMany(Persona, {
    foreignKey: 'idClub',
    sourceKey: 'idClub', 
    as: 'personas',     
    onDelete: 'SET NULL', 
    hooks: true
});
Club.hasMany(Equipo, {
    foreignKey: 'idClub',
    sourceKey: 'idClub', 
    as: 'equipos',      
    onDelete: 'CASCADE', 
    hooks: true
});

// --- Asociaciones para Persona ---
Persona.belongsTo(Club, {
    foreignKey: 'idClub',
    targetKey: 'idClub', 
    as: 'club'          
});

// --- Asociaciones para Equipo ---
Equipo.belongsTo(Club, {
    foreignKey: 'idClub',
    targetKey: 'idClub', 
    as: 'club'          
});
Equipo.belongsTo(Categoria, {
    foreignKey: 'idCategoria',
    targetKey: 'idCategoria', 
    as: 'categoria'     
});

// --- Asociaciones para Categoría ---
Categoria.hasMany(Equipo, {
    foreignKey: 'idCategoria',
    sourceKey: 'idCategoria', 
    as: 'equipos',      
    onDelete: 'SET NULL',
    hooks: true
});

// --- Asociaciones para Rol y Usuario ---

if (Usuario && Rol) {
    Rol.hasMany(Usuario, {
        foreignKey: 'rolId', 
        sourceKey: 'id',    
        as: 'usuarios',
        onDelete: 'SET NULL', 
        hooks: true
    });
    Usuario.belongsTo(Rol, {
        foreignKey: 'rolId', 
        targetKey: 'id',     
        as: 'rol'
    });
}


// --- Inicialización de Express ---
var app = express();

// Middlewares
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors({ 
    origin: 'http://localhost:4200',
    credentials: true
}));

// Configuración de sesiones para Passport
app.use(session({
    secret: process.env.JWT_SECRET || 'tu_clave_secreta_jwt',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
}));

// Inicializar Passport
app.use(passport.initialize());
app.use(passport.session());

// Configuraciones (setting)
app.set('port', process.env.PORT || 3000);

// --- Rutas de API ---
app.get('/', (req, res) => {
    res.send('API de la Federación Jujeña de Voley - ¡Todo funciona!');
});
app.use('/api/usuario', require('./routes/usuario.routes'));
app.use('/api/rol', require('./routes/rol.routes'));
app.use('/api/personas', require('./routes/persona.routes')); 
app.use('/api/clubs', require('./routes/club.routes'));
app.use('/api/categorias', require('./routes/categoria.routes'));
app.use('/api/equipos', require('./routes/equipo.routes'));
app.use('/api/auth', require('./routes/auth.routes'));

// --- Iniciar el servidor ---
async function startServer() {
    try {
       
        await connectDB();
        console.log('✔ Conexión a la base de datos establecida correctamente.');

        
        await sequelize.sync({ force: false });
        console.log("✔ Todos los modelos fueron sincronizados exitosamente con la base de datos.");

        app.listen(app.get('port'), () => {
            console.log(`🚀 Servidor backend escuchando en http://localhost:${app.get('port')}`);
        });
    } catch (error) {
        console.error('❌ Error al conectar o sincronizar con PostgreSQL:', error);
       
        process.exit(1);
    }
}

startServer();
