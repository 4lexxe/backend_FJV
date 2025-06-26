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
        allowNull: true,
        comment: 'Fecha de inicio/alta de la licencia'
    },
    // Nuevo campo para fecha de vencimiento/baja de licencia
    fechaLicenciaBaja: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: 'Fecha de vencimiento/baja de la licencia (sincronizada con credencial)'
    },
    estadoLicencia: {
        type: DataTypes.STRING(20),
        allowNull: true,
        defaultValue: 'ACTIVO',
        comment: 'Estado de la licencia: ACTIVO, INACTIVO, SUSPENDIDO, VENCIDO',
        validate: {
            isIn: {
                args: [['ACTIVO', 'INACTIVO', 'SUSPENDIDO', 'VENCIDO']],
                msg: "Estado solo puede ser ACTIVO, INACTIVO, SUSPENDIDO o VENCIDO"
            }
        }
    },
    motivoSuspension: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Motivo de suspensión si el estado de la licencia es SUSPENDIDO'
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
    // Campo actualizado para URL de ImgBB
    fotoPerfil: {
        type: DataTypes.STRING(1000), // URL de la imagen en ImgBB
        allowNull: true,
        comment: 'URL de la foto de perfil en ImgBB'
    },
    // Nuevo campo para URL de eliminación
    fotoPerfilDeleteUrl: {
        type: DataTypes.STRING(1000),
        allowNull: true,
        comment: 'URL para eliminar la imagen de ImgBB'
    },
    fotoPerfilTipo: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Tipo MIME de la imagen (image/jpeg, image/png, etc.)'
    },
    fotoPerfilTamano: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Tamaño del archivo en bytes'
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