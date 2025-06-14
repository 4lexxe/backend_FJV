const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Categoria = sequelize.define('Categoria', {
    idCategoria: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
    edadMaxima: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    edadMinima: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: 'categorias', 
    timestamps: true
});

module.exports = Categoria;