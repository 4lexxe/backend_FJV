const express = require('express');
const cors = require('cors');
const { sequelize, connectDB } = require('./database');

// Importa tus modelos para que Sequelize los conozca
require('./models/Rol');     // Asegúrate de que este esté
require('./models/Usuario'); // ¡NUEVO!

var app = express();

// Middlewares
// Para Base64 y payloads más pesados, necesitas un límite más alto.
app.use(express.json({ limit: '50mb' })); // Aumentado a 50MB
// Si también usas `express.urlencoded` para datos de formularios, considera aumentar su límite también.
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.json());
app.use(cors({ origin: 'http://localhost:4200' }));

// Configuraciones (setting)
app.set('port', process.env.PORT || 3000);

// Cargamos el modulo de direccionamiento de rutas
// Cuando tengas tus modelos y rutas definidos, los importarás aquí
// Por ejemplo:
app.use('/api/usuario', require('./routes/usuario.routes'));
app.use('/api/rol', require('./routes/rol.routes'));

// Iniciar el servidor
async function startServer() {
    await connectDB(); // Conectamos a la base de datos

    // Sincronizar modelos con la base de datos.
    // Esto creará las tablas si no existen.
    // Solo úsalo en desarrollo. En producción, gestiona las migraciones de otra manera.
    await sequelize.sync({ force: false }); // ¡Recuerda, `force: true` borrará tus datos!
    console.log("Todos los modelos fueron sincronizados exitosamente con la base de datos.");

    app.listen(app.get('port'), () => {
        console.log(`Servidor iniciado en el puerto ${app.get('port')}`);
    });
}

startServer();