const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Persona = sequelize.define('Persona', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombreApellido: { type: DataTypes.STRING(255), allowNull: false },
    dni: { type: DataTypes.STRING(20), allowNull: false },
    fechaNacimiento: { type: DataTypes.DATEONLY, allowNull: false },
    clubActual: { type: DataTypes.STRING(255), allowNull: true },
    licenciaFEVA: { type: DataTypes.STRING(50), allowNull: true },
    fechaLicencia: { type: DataTypes.DATEONLY, allowNull: true },
    tipo: { type: DataTypes.STRING(50), allowNull: true },
    pass: { type: DataTypes.STRING(255), allowNull: true },
    clubPass: { type: DataTypes.STRING(255), allowNull: true },
    categoria: { type: DataTypes.STRING(100), allowNull: true },
    categoriaNivel: { type: DataTypes.INTEGER, allowNull: true },
    otorgado: { type: DataTypes.BOOLEAN, allowNull: true }
}, {
    tableName: 'personas', // Nombre de la tabla en la base de datos
    timestamps: true // Para que Sequelize agregue automáticamente createdAt y updatedAt
});

module.exports = Persona;