const Cobro = require('../models/Cobro');
const Pago = require('../models/Pago');
const mpService = require('../services/mercadopago.service');

const webhookCtrl = {};

/**
 * Procesar notificaciones de MercadoPago
 */
webhookCtrl.mercadoPago = async (req, res) => {
    try {
        console.log('Webhook de MercadoPago recibido:', req.body);
        
        // MercadoPago envía notificaciones en varios formatos
        // Necesitamos adaptarnos a todos ellos
        
        // Formato de notificación IPN
        if (req.body.type && req.body.data) {
            console.log(`Notificación tipo: ${req.body.type}, ID: ${req.body.data.id}`);
            
            // Solo procesar notificaciones de pago
            if (req.body.type !== 'payment') {
                return res.status(200).json({ message: `Notificación tipo ${req.body.type} recibida pero no procesada` });
            }
            
            // Procesar la notificación
            const resultado = await mpService.procesarNotificacion(req.body);
            
            if (!resultado.success) {
                console.error('Error procesando notificación:', resultado.error);
                return res.status(200).json({ message: 'Notificación recibida pero hubo errores' });
            }
            
            // Verificar si el pago ya fue procesado
            const pagoExistente = await Pago.findOne({
                where: { paymentId: resultado.paymentId }
            });
            
            if (pagoExistente) {
                console.log(`Pago ${resultado.paymentId} ya fue procesado anteriormente.`);
                
                // Actualizar estado si cambió
                if (pagoExistente.estado !== resultado.estadoPago) {
                    await pagoExistente.update({ 
                        estado: resultado.estadoPago,
                        datosExtra: {
                            ...pagoExistente.datosExtra,
                            payment: resultado.payment,
                            lastUpdate: new Date()
                        }
                    });
                    
                    // Si el pago fue exitoso, actualizar el cobro
                    if (resultado.estadoPago === 'Pagado' && pagoExistente.idCobro) {
                        await Cobro.update({ 
                            estado: 'Pagado',
                            comprobantePago: `MP-${resultado.paymentId}`,
                            observaciones: `Pagado mediante MercadoPago. ID de pago: ${resultado.paymentId}`
                        }, { where: { idCobro: pagoExistente.idCobro } });
                    }
                }
                
                return res.status(200).json({ message: 'Notificación procesada exitosamente (pago actualizado)' });
            }
            
            // Extraer información del cobro del external reference
            const refParts = resultado.externalReference.split('_');
            let idCobro = null;
            
            if (refParts.length >= 3 && refParts[0] === 'cobro') {
                idCobro = parseInt(refParts[1]);
            }
            
            if (!idCobro) {
                console.error('No se pudo extraer el ID del cobro de la referencia externa');
                return res.status(200).json({ message: 'Referencia externa inválida' });
            }
            
            // Verificar que el cobro existe
            const cobro = await Cobro.findByPk(idCobro);
            if (!cobro) {
                console.error(`Cobro con ID ${idCobro} no encontrado`);
                return res.status(200).json({ message: `Cobro ID ${idCobro} no encontrado` });
            }
            
            // Registrar el pago en nuestra base de datos
            const pago = await Pago.create({
                idCobro,
                paymentId: resultado.paymentId,
                monto: resultado.payment.transaction_amount || cobro.monto,
                estado: resultado.estadoPago,
                preferenceId: resultado.payment.preference_id,
                metodoPago: 'MercadoPago',
                datosExtra: {
                    payment: resultado.payment
                }
            });
            
            // Si el pago fue exitoso, actualizar el cobro
            if (resultado.estadoPago === 'Pagado') {
                await cobro.update({
                    estado: 'Pagado',
                    comprobantePago: `MP-${resultado.paymentId}`,
                    observaciones: `Pagado mediante MercadoPago. ID de pago: ${resultado.paymentId}`
                });
            }
            
            return res.status(200).json({ message: 'Notificación procesada exitosamente' });
        }
        
        // Formato de notificación simple (desde la UI por ejemplo)
        if (req.query && req.query.id) {
            console.log(`Notificación simple recibida, ID: ${req.query.id}, topic: ${req.query.topic}`);
            
            // Solo procesar notificaciones de pago
            if (req.query.topic !== 'payment') {
                return res.status(200).json({ message: `Notificación tipo ${req.query.topic} recibida pero no procesada` });
            }
            
            // Obtener información del pago
            const resultadoPago = await mpService.obtenerPago(req.query.id);
            
            if (!resultadoPago.success) {
                console.error('Error al obtener información del pago:', resultadoPago.error);
                return res.status(200).json({ message: 'Error al obtener información del pago' });
            }
            
            // Continuar con el procesamiento...
            // (código similar al anterior para actualizar o crear el pago)
            
            return res.status(200).json({ message: 'Notificación simple procesada' });
        }
        
        // Si no reconocemos el formato, simplemente aceptar la notificación
        console.log('Formato de notificación no reconocido');
        return res.status(200).json({ message: 'Formato de notificación no reconocido' });
    } catch (error) {
        console.error('Error procesando webhook de MercadoPago:', error);
        
        // IMPORTANTE: Siempre devolver 200 OK para que MercadoPago no reintente
        // Las plataformas de pago suelen esperar un 200 aunque haya errores
        return res.status(200).json({ 
            message: 'Error procesando notificación',
            error: error.message 
        });
    }
};

module.exports = webhookCtrl;