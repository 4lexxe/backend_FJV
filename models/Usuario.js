const { DataTypes } = require('sequelize');
const { sequelize } = require('../database');
const Rol = require('./Rol'); // Importamos el modelo Rol para la relación
const bcrypt = require('bcryptjs'); // Necesario para hashear contraseñas

const Usuario = sequelize.define('Usuario', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true // Validación para formato de email
        }
    },
    password: {
        type: DataTypes.STRING(255), // Aquí almacenaremos el hash de la contraseña
        allowNull: false
    }
    // rolId se creará automáticamente por la relación
}, {
    tableName: 'usuarios', // Nombre de la tabla en la base de datos
    timestamps: true,
    hooks: {
        // Hook (gancho) para hashear la contraseña antes de guardar el usuario
        beforeCreate: async (usuario) => {
            if (usuario.password) {
                const salt = await bcrypt.genSalt(10); // Genera un "salt" para la encriptación
                usuario.password = await bcrypt.hash(usuario.password, salt); // Hashea la contraseña
            }
        },
        beforeUpdate: async (usuario) => {
            // Solo hashea si la contraseña ha sido modificada
            if (usuario.changed('password')) {
                const salt = await bcrypt.genSalt(10);
                usuario.password = await bcrypt.hash(usuario.password, salt);
            }
        }
    }
});

// Definición de la relación: Un Usuario pertenece a un Rol
Usuario.belongsTo(Rol, {
    foreignKey: 'rolId', // Clave foránea en la tabla 'usuarios'
    as: 'rol' // Alias para acceder al rol desde el usuario (ej: usuario.rol)
});

// Definición de la relación inversa: Un Rol puede tener muchos Usuarios
Rol.hasMany(Usuario, {
    foreignKey: 'rolId', // Clave foránea en la tabla 'usuarios'
    as: 'usuarios' // Alias para acceder a los usuarios desde el rol (ej: rol.usuarios)
});

// Método para comparar contraseñas (útil para el login)
Usuario.prototype.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = Usuario;