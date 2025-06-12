const { Sequelize } = require('sequelize');

// Configuración de la conexión a PostgreSQL
// Asegúrate de reemplazar 'nombre_de_tu_base_de_datos', 'tu_usuario', 'tu_contraseña'
// y 'localhost' (si tu base de datos no está en el mismo equipo) con tus propios datos.
const sequelize = new Sequelize('DBFJV', 'postgres', 'postgres', {
    host: 'localhost', // O la IP/dominio de tu servidor PostgreSQL
    dialect: 'postgres',
    port: 5432, // Puerto por defecto de PostgreSQL, cámbialo si es diferente
    logging: true // Puedes establecerlo en true para ver las consultas SQL en la consola
});

// Función para probar la conexión a la base de datos
async function connectDB() {
    try {
        await sequelize.authenticate();
        console.log('Conexión a la base de datos PostgreSQL establecida exitosamente.');
    } catch (error) {
        console.error('No se pudo conectar a la base de datos:', error);
        // Opcional: podrías salir del proceso si la conexión a la base de datos es crítica
        // process.exit(1);
    }
}

// Exportamos la instancia de sequelize y la función de conexión
module.exports = {
    sequelize,
    connectDB
};