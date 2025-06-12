const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token de acceso requerido'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_clave_secreta_jwt');
        
        const usuario = await Usuario.findByPk(decoded.id);
        if (!usuario) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido'
            });
        }

        req.user = usuario;
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Token inválido'
        });
    }
};

module.exports = authMiddleware;
