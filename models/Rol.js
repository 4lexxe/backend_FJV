const { DataTypes } = require('sequelize');
const { sequelize } = require('../database');

const Rol = sequelize.define('Rol', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: DataTypes.STRING(100), // Nombre del rol (ej: 'Jugador', 'Entrenador', 'Administrador')
        allowNull: false,
        unique: true
    },
    descripcion: {
        type: DataTypes.STRING(255), // Breve descripción del rol
        allowNull: true
    }
}, {
    tableName: 'roles', // Nombre de la tabla en la base de datos
    timestamps: true // Para createdAt y updatedAt
});

module.exports = Rol;