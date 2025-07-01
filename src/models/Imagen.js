const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Imagen = sequelize.define('Imagen', {
    idImagen: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    titulo: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    url: {
        type: DataTypes.STRING(1000),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'La URL de la imagen es obligatoria'
            },
            isUrl: {
                msg: 'La URL no tiene un formato válido'
            }
        }
    },
    thumbUrl: {
        type: DataTypes.STRING(1000),
        allowNull: true,
        comment: 'URL de la miniatura de la imagen'
    },
    deleteUrl: {
        type: DataTypes.STRING(1000),
        allowNull: true,
        comment: 'URL para eliminar la imagen de ImgBB'
    },
    orden: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Orden de aparición de la imagen en la galería'
    },
    fechaSubida: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    metadatos: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Metadatos adicionales de la imagen (dimensiones, tamaño, etc.)'
    },
    idGaleria: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'galerias',
            key: 'idGaleria'
        },
        onDelete: 'CASCADE',
        comment: 'ID de la galería a la que pertenece esta imagen'
    }
}, {
    tableName: 'imagenes',
    timestamps: true
});

module.exports = Imagen;
