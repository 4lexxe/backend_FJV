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
    tipo: {
        type: DataTypes.ENUM('afiliado', 'division', 'competencia'),
        allowNull: false
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