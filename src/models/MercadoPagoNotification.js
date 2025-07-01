const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const MercadoPagoNotification = sequelize.define(
  "MercadoPagoNotification",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    // ID del recurso notificado por Mercado Pago (ej. ID de pago, ID de suscripción)
    resource_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: "uniqueNotification", // Para asegurar que no haya duplicados si Mercado Pago envía la misma notificación
    },
    // Tipo de notificación (payment, preapproval, merchant_order, etc.)
    topic: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: "uniqueNotification", // Parte de la clave única
    },
    // ID del usuario que generó la notificación
    user_id: {
      type: DataTypes.BIGINT, // Puede ser un número grande
      allowNull: true,
    },
    // ID de la aplicación
    application_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    // Versión de la API de notificaciones
    api_version: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // Fecha y hora de creación del evento en Mercado Pago (formato ISO 8601)
    sent_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // Estado de procesamiento interno (ej. 'pending', 'processed', 'error')
    processing_status: {
      type: DataTypes.STRING,
      defaultValue: "pending",
    },
    // Cualquier mensaje de error durante el procesamiento interno
    processing_error: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Guarda el cuerpo RAW completo de la notificación para depuración
    raw_payload: {
      type: DataTypes.JSONB, // JSONB para PostgreSQL es eficiente para JSON
      allowNull: true,
    },
    // ID de la transacción asociado (si es un pago)
    transaction_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
     payment_status: { // Estado del recurso (ej. 'approved', 'pending', 'rejected' para pagos)
        type: DataTypes.STRING,
        allowNull: true, // Puede ser nulo si no es un tipo de notificación de pago o si falla la consulta
    },
  },
  {
    // Opciones del modelo
    tableName: "mercadoPago_notifications", // Nombre de la tabla en la base de datos
    timestamps: true, // `createdAt` y `updatedAt` automáticamente
    indexes: [
      {
        unique: true,
        fields: ["resource_id", "topic"],
      },
    ],
  }
);

module.exports = MercadoPagoNotification;
