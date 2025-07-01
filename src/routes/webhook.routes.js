const express = require('express');
const webhookCtrl = require('../controllers/webhook.controller');
const router = express.Router();

// Ruta para recibir las notificaciones de Mercado Pago
// Es CRUCIAL que esta ruta sea POST y que NO tenga ningún middleware de autenticación (ej. JWT)
// Mercado Pago no envía tokens de autenticación en sus webhooks.
router.post('/mercadopago', webhookCtrl.handleMercadoPagoNotification);

module.exports = router;