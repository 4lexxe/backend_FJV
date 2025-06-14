const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Credencial = sequelize.define(
  "Credencial",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    idPersona: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "personas",
        key: "idPersona",
      },
    },
    fechaEmision: { type: DataTypes.DATEONLY, allowNull: false },
    fechaVencimiento: { type: DataTypes.DATEONLY, allowNull: false },
    codigoQR: { type: DataTypes.TEXT, allowNull: false, unique: true },
    estado: {
      type: DataTypes.ENUM("ACTIVO", "INACTIVO"),
      allowNull: false,
      defaultValue: "ACTIVO",
    },
  },
  {
    tableName: "credenciales",
    timestamps: true,
  }
);

module.exports = Credencial;
