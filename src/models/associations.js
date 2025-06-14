/**
 * Definición centralizada de todas las asociaciones entre modelos
 * Este archivo se encarga de establecer las relaciones entre
 * los diferentes modelos de la aplicación
 */

// Importar todos los modelos
const Rol = require('./Rol');
const Usuario = require('./Usuario');
const Club = require('./Club');
const Categoria = require('./Categoria');
const Equipo = require('./Equipo');
const Persona = require('./Persona');

/**
 * Define todas las asociaciones entre modelos
 */
function defineAssociations() {
    console.log('Definiendo asociaciones entre modelos...');
    
    // --- Asociaciones para Club ---
    Club.hasMany(Persona, {
        foreignKey: 'idClub',
        sourceKey: 'idClub', 
        as: 'personas',     
        onDelete: 'SET NULL', 
        hooks: true
    });
    Club.hasMany(Equipo, {
        foreignKey: 'idClub',
        sourceKey: 'idClub', 
        as: 'equipos',      
        onDelete: 'CASCADE', 
        hooks: true
    });

    // --- Asociaciones para Persona ---
    Persona.belongsTo(Club, {
        foreignKey: 'idClub',
        targetKey: 'idClub', 
        as: 'club'          
    });

    // --- Asociaciones para Equipo ---
    Equipo.belongsTo(Club, {
        foreignKey: 'idClub',
        targetKey: 'idClub', 
        as: 'club'          
    });
    Equipo.belongsTo(Categoria, {
        foreignKey: 'idCategoria',
        targetKey: 'idCategoria', 
        as: 'categoria'     
    });

    // --- Asociaciones para Categoría ---
    Categoria.hasMany(Equipo, {
        foreignKey: 'idCategoria',
        sourceKey: 'idCategoria', 
        as: 'equipos',      
        onDelete: 'SET NULL',
        hooks: true
    });

    // --- Asociaciones para Rol y Usuario ---
    if (Usuario && Rol) {
        Rol.hasMany(Usuario, {
            foreignKey: 'rolId', 
            sourceKey: 'id',    
            as: 'usuarios',
            onDelete: 'SET NULL', 
            hooks: true
        });
        Usuario.belongsTo(Rol, {
            foreignKey: 'rolId', 
            targetKey: 'id',     
            as: 'rol'
        });
    }
    
    console.log('Asociaciones definidas correctamente');
}

module.exports = defineAssociations;
