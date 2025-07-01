const axios = require('axios');
const crypto = require('crypto');
const MercadoPagoNotification = require('../models/MercadoPagoNotification');

const webhookCtrl = {};

webhookCtrl.handleMercadoPagoNotification = async (req, res) => {
  console.log('Webhook de Mercado Pago recibido (RAW):', JSON.stringify(req.body, null, 2));
  console.log('Headers (RAW):', req.headers);

  const resourceId = req.body.data && req.body.data.id ? req.body.data.id : null;
  const eventTopic = req.body.type || req.body.topic;

  const notificationIdHeader = req.headers['x-notification-id'];
  const signatureHeader = req.headers['x-signature'];
  const requestMetadata = req.headers['x-request-metadata'];
  const timestampHeader = requestMetadata ? requestMetadata.split(',').find(s => s.startsWith('ts=')).substring(3) : null;


  const WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error('ERROR: MP_WEBHOOK_SECRET no está definido en las variables de entorno.');
    return res.status(500).send('Webhook secret not configured.');
  }

  // --- 1. Verificar la firma (¡CRUCIAL para seguridad!) ---
  if (!signatureHeader || !timestampHeader || !notificationIdHeader) {
    console.warn('Advertencia: Notificación de Mercado Pago sin firma, timestamp o notification ID en headers. No se puede verificar la autenticidad.');
  } else {
    const dataToHash = `id:${notificationIdHeader};ts:${timestampHeader};topic:${eventTopic};resource:${resourceId}`;
    const expectedSignature = crypto.createHmac('sha256', WEBHOOK_SECRET)
                                    .update(dataToHash)
                                    .digest('hex');

    const receivedHashEntry = signatureHeader.split(',').find(s => s.startsWith('v1='));
    const receivedHash = receivedHashEntry ? receivedHashEntry.substring(3) : null;

    if (!receivedHash || receivedHash !== expectedSignature) {
      console.error('ERROR: Firma de webhook inválida.');
      console.error('Datos usados para hash:', dataToHash);
      console.error('Firma esperada:', expectedSignature);
      console.error('Firma recibida:', receivedHash || 'N/A');
      return res.status(401).send('Unauthorized: Invalid signature.');
    }
    console.log('Firma de webhook verificada exitosamente.');
  }

  if (!resourceId) {
    console.warn(`Advertencia: Webhook recibido con topic '${eventTopic}' pero sin un resource ID válido en 'data.id'.`);
    return res.status(200).send('No resource ID provided in notification. OK.');
  }

  // --- 2. Guardar la notificación en la base de datos ---
  try {
    const [notification, created] = await MercadoPagoNotification.findOrCreate({
      where: { resource_id: resourceId, topic: eventTopic },
      defaults: {
        resource_id: resourceId,
        topic: eventTopic,
        user_id: req.body.user_id,
        application_id: req.body.application_id,
        api_version: req.body.api_version,
        sent_at: timestampHeader ? new Date(parseInt(timestampHeader) * 1000) : new Date(req.body.date_created || Date.now()),
        processing_status: 'pending',
        raw_payload: req.body,
        transaction_id: eventTopic === 'payment' ? resourceId : null,
        // payment_status se actualizará después de procesar
      }
    });

    if (!created) {
      console.warn(`Notificación duplicada o ya procesada (resource_id: ${resourceId}, topic: ${eventTopic}).`);
      if (notification.processing_status === 'pending') {
        console.log(`Re-procesando notificación pendiente: ${resourceId}`);
      }
      return res.status(200).send('Notification already processed or pending. OK.');
    }

    console.log(`Notificación de Mercado Pago (ID interno: ${notification.id}) guardada para resource: ${resourceId}.`);

    // Variable para almacenar el estado del pago/recurso que devolverán las funciones de procesamiento
    let actualPaymentStatus = null;

    // --- 3. Procesar la notificación según el 'topic' (Lógica de Negocio) ---
    switch (eventTopic) {
      case 'payment':
        actualPaymentStatus = await processPaymentNotification(resourceId);
        break;
      case 'preapproval':
        actualPaymentStatus = await processSubscriptionNotification(resourceId);
        break;
      case 'merchant_order':
        actualPaymentStatus = await processMerchantOrderNotification(resourceId);
        break;
      default:
        console.log(`Tipo de notificación '${eventTopic}' no manejado por la lógica de negocio.`);
        break;
    }

    // --- 4. Marcar la notificación como procesada y actualizar el estado del pago/recurso ---
    await notification.update({
      processing_status: 'processed',
      payment_status: actualPaymentStatus // Actualizar el nuevo campo con el estado real
    });
    console.log(`Notificación (ID interno: ${notification.id}) marcada como procesada con éxito. Estado del pago/recurso: ${actualPaymentStatus || 'N/A'}.`);

    res.status(200).send('OK');

  } catch (error) {
    console.error(`ERROR CATASTRÓFICO al procesar el webhook para resource_id ${resourceId} y topic ${eventTopic}:`, error);

    if (error.name === 'SequelizeUniqueConstraintError') {
      console.warn('Error de restricción única: Notificación ya existe en la DB. Respondiendo 200 OK.');
      return res.status(200).send('Notification already exists (duplicate). OK.');
    }

    if (resourceId && eventTopic) {
        try {
            const failedNotification = await MercadoPagoNotification.findOne({ where: { resource_id: resourceId, topic: eventTopic } });
            if (failedNotification) {
                await failedNotification.update({
                    processing_status: 'error',
                    processing_error: error.message,
                    // Aquí no actualizamos payment_status porque hubo un error al obtenerlo o procesarlo
                });
                console.log(`Notificación (ID interno: ${failedNotification.id}) marcada como con error.`);
            }
        } catch (dbError) {
            console.error('Error al intentar marcar la notificación como con error en DB:', dbError);
        }
    }
    res.status(500).send('Internal Server Error. Please check backend logs.');
  }
};

// --- Funciones de procesamiento de ejemplo (Ahora devuelven el estado) ---

async function processPaymentNotification(paymentId) {
  try {
    console.log(`Iniciando procesamiento de notificación de pago para ID: ${paymentId}`);
    const response = await axios.get(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
      },
    });
    const paymentDetails = response.data;
    console.log(`Detalles del pago ${paymentId}: Status -> ${paymentDetails.status}, External Ref -> ${paymentDetails.external_reference}`);

    // *** AQUÍ VA TU LÓGICA DE NEGOCIO REAL PARA ESTE ESTADO ***
    // (Actualizar tu propia tabla de órdenes/transacciones)
    if (paymentDetails.status === 'approved') {
      console.log(`Pago ${paymentId} APROBADO. Ejecutando lógica de aprobación...`);
    } else if (paymentDetails.status === 'pending') {
      console.log(`Pago ${paymentId} PENDIENTE. Ejecutando lógica de pendiente...`);
    } else if (paymentDetails.status === 'rejected') {
        console.log(`Pago ${paymentId} RECHAZADO. Ejecutando lógica de rechazo...`);
    } else {
      console.log(`Pago ${paymentId} con estado desconocido: ${paymentDetails.status}.`);
    }
    console.log(`Finalizado procesamiento de pago para ID: ${paymentId}. Devolviendo estado: ${paymentDetails.status}`);
    return paymentDetails.status; // Retorna el estado del pago
  } catch (error) {
    console.error(`Error en processPaymentNotification para ${paymentId}:`, error.response ? error.response.data : error.message);
    return null; // Retorna nulo si hay un error al obtener el estado
  }
}

async function processSubscriptionNotification(preapprovalId) {
  try {
    console.log(`Iniciando procesamiento de notificación de suscripción para ID: ${preapprovalId}`);
    const response = await axios.get(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
      headers: {
        Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
      },
    });
    const preapprovalDetails = response.data;
    console.log(`Detalles de la suscripción ${preapprovalId}: Status -> ${preapprovalDetails.status}`);
    console.log(`Finalizado procesamiento de suscripción para ID: ${preapprovalId}. Devolviendo estado: ${preapprovalDetails.status}`);
    return preapprovalDetails.status; // Retorna el estado de la suscripción
  } catch (error) {
    console.error(`Error en processSubscriptionNotification para ${preapprovalId}:`, error.response ? error.response.data : error.message);
    return null; // Retorna nulo si hay un error
  }
}

async function processMerchantOrderNotification(merchantOrderId) {
    try {
        console.log(`Iniciando procesamiento de notificación de orden de comerciante para ID: ${merchantOrderId}`);
        const response = await axios.get(`https://api.mercadopago.com/merchant_orders/${merchantOrderId}`, {
            headers: {
                Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
            },
        });
        const merchantOrderDetails = response.data;
        console.log(`Detalles de la orden de comerciante ${merchantOrderId}: Status -> ${merchantOrderDetails.status}, Pagar_id -> ${merchantOrderDetails.payments[0]?.id}`);
        console.log(`Finalizado procesamiento de orden de comerciante para ID: ${merchantOrderId}. Devolviendo estado: ${merchantOrderDetails.status}`);
        return merchantOrderDetails.status; // Retorna el estado de la orden de comerciante
    } catch (error) {
        console.error(`Error en processMerchantOrderNotification para ${merchantOrderId}:`, error.response ? error.response.data : error.message);
        return null; // Retorna nulo si hay un error
    }
}

module.exports = webhookCtrl;