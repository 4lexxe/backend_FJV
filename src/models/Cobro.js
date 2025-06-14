const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Cobro = sequelize.define(
  "Cobro",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    monto: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    fecha: { type: DataTypes.DATEONLY, allowNull: false },
    concepto: { type: DataTypes.STRING, allowNull: false },
    idClub: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "clubs",
        key: "idClub",
      },
    },
    estado: {
      type: DataTypes.ENUM("PENDIENTE", "PAGADO"),
      allowNull: false,
      defaultValue: "PENDIENTE",
    },
    fechaVencimiento: { type: DataTypes.DATEONLY, allowNull: true },
    tipoComprobante: { type: DataTypes.STRING, allowNull: false },
  },
  {
    tableName: "cobros",
    timestamps: true,
  }
);

module.exports = Cobro;
