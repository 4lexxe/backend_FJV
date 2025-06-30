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
        unique: false // Puede haber nombres repetidos en distintos tipos
    },
    tipo: {
        type: DataTypes.STRING(20),
        allowNull: false
    }
}, {
    tableName: 'categorias', 
    timestamps: true
});

module.exports = Categoria;