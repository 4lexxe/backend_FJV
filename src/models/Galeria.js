const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Galeria = sequelize.define('Galeria', {
    idGaleria: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    nombre: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'El nombre de la galería es obligatorio'
            }
        }
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    fechaCreacion: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    portada: {
        type: DataTypes.STRING(1000),
        allowNull: true,
        comment: 'URL de la imagen de portada de la galería'
    },
    publicada: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Indica si la galería es visible públicamente'
    },
    autorId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'usuarios',
            key: 'id'
        },
        comment: 'ID del usuario que creó la galería'
    }
}, {
    tableName: 'galerias',
    timestamps: true
});

module.exports = Galeria;
