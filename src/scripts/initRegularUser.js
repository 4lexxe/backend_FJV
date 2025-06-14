/**
 * Script para inicializar un usuario regular en la base de datos
 * 
 * Este script crea un usuario con rol "usuario" (id=2) si no existe
 * ningún usuario con ese rol
 */

require('dotenv').config({ path: '../.env' });
const { sequelize, connectDB } = require('../config/database');
const Usuario = require('../models/Usuario');
const Rol = require('../models/Rol');
const defineAssociations = require('../models/associations');

// Datos del usuario regular por defecto
const DEFAULT_USER = {
    nombre: 'Usuario',
    apellido: 'Regular',
    email: 'usuario@sistema.com',
    password: 'Usuario123!'
};

/**
 * Inicializa un usuario regular si no existe
 */
async function initRegularUser() {
    try {
        console.log('Conectando a la base de datos...');
        await connectDB();
        
        // Definir asociaciones antes de usarlas
        defineAssociations();
        
        // Buscar rol de usuario
        console.log('Buscando rol de usuario regular...');
        let userRol = await Rol.findOne({ where: { nombre: 'usuario' } });
        
        // Si no existe el rol usuario, crearlo
        if (!userRol) {
            console.log('Rol de usuario no encontrado, creando...');
            userRol = await Rol.create({
                nombre: 'usuario',
                descripcion: 'Usuario regular del sistema'
            });
            console.log('Rol de usuario creado con ID:', userRol.id);
        } else {
            console.log('Rol de usuario encontrado con ID:', userRol.id);
        }
        
        // Verificar si existe algún usuario con rol de usuario
        const userExists = await Usuario.findOne({
            where: { rolId: userRol.id }
        });
        
        if (userExists) {
            console.log('Ya existe un usuario regular:', userExists.email);
            return;
        }
        
        // Crear usuario regular
        console.log('Creando usuario regular por defecto...');
        const regularUser = await Usuario.create({
            nombre: DEFAULT_USER.nombre,
            apellido: DEFAULT_USER.apellido,
            email: DEFAULT_USER.email,
            password: DEFAULT_USER.password,
            rolId: userRol.id,
            emailVerificado: true
        });
        
        console.log('✅ Usuario regular creado exitosamente:');
        console.log(`   - Nombre: ${regularUser.nombre} ${regularUser.apellido}`);
        console.log(`   - Email: ${regularUser.email}`);
        console.log(`   - Contraseña: ${DEFAULT_USER.password}`);
        
    } catch (error) {
        console.error('❌ Error al inicializar usuario regular:', error);
    } finally {
        // Cerrar conexión
        await sequelize.close();
        console.log('Conexión a la base de datos cerrada');
    }
}

// Ejecutar la función
initRegularUser();
