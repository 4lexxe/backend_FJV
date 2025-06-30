/**
 * Definición centralizada de todas las asociaciones entre modelos
 * Este archivo se encarga de establecer las relaciones entre
 * los diferentes modelos de la aplicación
 */

// Importar todos los modelos
const Rol = require("./Rol");
const Usuario = require("./Usuario");
const Club = require("./Club");
const Categoria = require("./Categoria");
const Equipo = require("./Equipo");
const Persona = require("./Persona");
const Cobro = require("./Cobro");
const Credencial = require("./Credencial");

/**
 * Define todas las asociaciones entre modelos
 */
function defineAssociations() {
  console.log("Definiendo asociaciones entre modelos...");

  // --- Asociaciones para Club ---
  Club.hasMany(Persona, {
    foreignKey: "idClub",
    sourceKey: "idClub",
    as: "personas",
    onDelete: "SET NULL",
    hooks: true,
  });
  Club.hasMany(Equipo, {
    foreignKey: "idClub",
    sourceKey: "idClub",
    as: "equipos",
    onDelete: "CASCADE",
    hooks: true,
  });
  Club.hasMany(Cobro, {
    foreignKey: "idClub",
    sourceKey: "idClub",
    as: "cobros",
    onDelete: "CASCADE",
    hooks: true,
  });

  // --- Asociaciones para Persona ---
  Persona.belongsTo(Club, {
    foreignKey: "idClub",
    targetKey: "idClub",
    as: "club",
  });

  // Relación entre Persona y Credencial (una persona puede tener varias credenciales)
  Persona.hasMany(Credencial, {
    foreignKey: "idPersona",
    as: "credenciales",
  });

  Credencial.belongsTo(Persona, {
    foreignKey: "idPersona",
    as: "persona",
  });

  // --- Asociaciones para Equipo ---
  Equipo.belongsTo(Club, {
    foreignKey: "idClub",
    targetKey: "idClub",
    as: "club",
  });
  Equipo.belongsTo(Categoria, {
    foreignKey: "idCategoria",
    targetKey: "idCategoria",
    as: "categoria",
  });
  Equipo.hasMany(Cobro, {
    foreignKey: "idEquipo",
    sourceKey: "idEquipo",
    as: "cobros",
    onDelete: "SET NULL",
    hooks: true,
  });

  // --- Asociaciones para Categoría ---
  Categoria.hasMany(Equipo, {
    foreignKey: "idCategoria",
    sourceKey: "idCategoria",
    as: "equipos",
    onDelete: "SET NULL",
    hooks: true,
  });

  // --- Asociaciones para Cobro ---
  Cobro.belongsTo(Club, {
    foreignKey: "idClub",
    targetKey: "idClub",
    as: "club",
  });
  Cobro.belongsTo(Equipo, {
    foreignKey: "idEquipo",
    targetKey: "idEquipo",
    as: "equipo",
  });

  // --- Asociaciones para Rol y Usuario ---
  Usuario.belongsTo(Rol, {
    foreignKey: "rolId",
    as: "rol",
  });

  Rol.hasMany(Usuario, {
    foreignKey: "rolId",
    as: "usuarios",
  });

  console.log("Asociaciones definidas correctamente");
}

module.exports = defineAssociations;
