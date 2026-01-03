const { Sequelize } = require('sequelize');
require('dotenv').config(); // Cargar variables de entorno automáticamente

let sequelize;

// Configuración para Render (o cualquier entorno que provea DATABASE_URL)
if (process.env.DATABASE_URL) {
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        protocol: 'postgres',
        logging: process.env.DB_LOGGING === 'true',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false // Necesario para conexiones seguras en Render/Heroku
            }
        }
    });
} else {
    // Configuración local o tradicional
    sequelize = new Sequelize(
        process.env.DB_NAME,
        process.env.DB_USER,
        process.env.DB_PASSWORD,
        {
            host: process.env.DB_HOST,
            dialect: 'postgres',
            port: process.env.DB_PORT,
            logging: process.env.DB_LOGGING === 'true'
        }
    );
}

// Función para probar la conexión a la base de datos
async function connectDB() {
    try {
        await sequelize.authenticate();
        console.log('Conexión a la base de datos PostgreSQL establecida exitosamente.');
    } catch (error) {
        console.error('No se pudo conectar a la base de datos:', error);
    }
}

// Exportamos la instancia de sequelize y la función de conexión
module.exports = {
    sequelize,
    connectDB
};