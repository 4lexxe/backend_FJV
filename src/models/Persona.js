const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database'); 

const Persona = sequelize.define('Persona', {
    idPersona: { 
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    nombreApellido: { 
        type: DataTypes.STRING(255), 
        allowNull: false 
    },
    dni: { 
        type: DataTypes.STRING(20), 
        allowNull: false, 
        unique: true // DNI único
    },
    fechaNacimiento: { 
        type: DataTypes.DATEONLY, 
        allowNull: false 
    },
    clubActual: { 
        type: DataTypes.STRING(255), 
        allowNull: true 
    },
    licenciaFEVA: { 
        type: DataTypes.STRING(50), 
        allowNull: true 
    },
    fechaLicencia: { 
        type: DataTypes.DATEONLY, 
        allowNull: true 
    },
    tipo: { 
        type: DataTypes.STRING(50), 
        allowNull: true 
    },
    
    paseClub: { 
        type: DataTypes.STRING(255), 
        allowNull: true 
    },
    categoria: { 
        type: DataTypes.STRING(100), 
        allowNull: true 
    },
    categoriaNivel: { 
        type: DataTypes.STRING(100), 
        allowNull: true 
    },
    otorgado: { 
        type: DataTypes.BOOLEAN, 
        defaultValue: false 
    },
    idClub: { 
        type: DataTypes.INTEGER,
        allowNull: true, 
        references: {
            model: 'clubs', 
            key: 'idClub'   
        }
    }
}, {
    tableName: 'personas', 
    timestamps: true 
});

module.exports = Persona;