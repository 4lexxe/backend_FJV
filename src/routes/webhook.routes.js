const express = require('express');
const router = express.Router();
const webhookCtrl = require('../controllers/webhook.controller');

// Webhooks NO DEBEN requerir autenticación
// MercadoPago no puede enviar tokens de autenticación
router.post('/mercadopago', webhookCtrl.mercadoPago);
router.get('/mercadopago', webhookCtrl.mercadoPago); // MercadoPago también envía notificaciones por GET

module.exports = router;