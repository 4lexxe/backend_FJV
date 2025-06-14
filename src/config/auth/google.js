/**
 * Estrategia de autenticación con Google OAuth2
 */

const GoogleStrategy = require('passport-google-oauth20').Strategy;
const Usuario = require('../../models/Usuario');
const Rol = require('../../models/Rol');

/**
 * Configura la estrategia de autenticación de Google
 */
module.exports = (passport) => {
    // Solo configurar si existen credenciales de Google
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        console.warn('⚠️ Credenciales de Google OAuth no configuradas');
        return;
    }
    
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback',
        passReqToCallback: true
    }, async (req, accessToken, refreshToken, profile, done) => {
        try {
            console.log('Procesando autenticación de Google');
            
            // Buscar rol apropiado para usuarios sociales
            const rol = await buscarRolParaUsuarioSocial();
            if (!rol) {
                return done(new Error('No se encontró un rol válido para usuarios'), false);
            }
            
            // Buscar o crear usuario
            const usuario = await buscarOCrearUsuario(profile, rol.id);
            
            return done(null, usuario);
        } catch (error) {
            console.error('Error en autenticación Google:', error);
            return done(error, false);
        }
    }));
};

/**
 * Busca un rol apropiado para usuarios de autenticación social
 */
async function buscarRolParaUsuarioSocial() {
    // Intentar diferentes nombres comunes para roles de usuario
    const nombresPosibles = ['usuario_social', 'user', 'usuario'];
    
    for (const nombre of nombresPosibles) {
        const rol = await Rol.findOne({ where: { nombre } });
        if (rol) return rol;
    }
    
    // Último recurso: cualquier rol que no sea admin
    const roles = await Rol.findAll();
    const rolNoAdmin = roles.find(r => r.nombre !== 'admin');
    
    // Si hay al menos un rol, aunque sea admin, usarlo
    return rolNoAdmin || roles[0] || null;
}

/**
 * Busca un usuario existente o crea uno nuevo basado en perfil de Google
 */
async function buscarOCrearUsuario(profile, rolId) {
    // Extraer datos del perfil
    const email = profile.emails?.[0]?.value;
    if (!email) {
        throw new Error('No se pudo obtener el email del perfil de Google');
    }
    
    // Buscar usuario por el ID de Google
    let usuario = await Usuario.findOne({ 
        where: { googleId: profile.id } // Sequelize mapeará esto a google_id
    });
    
    // Si no se encuentra, intentar buscar por email
    if (!usuario) {
        usuario = await Usuario.findOne({ where: { email } });
    }
    
    // Si no existe, crear nuevo usuario
    if (!usuario) {
        const nombre = profile.name?.givenName || profile.displayName?.split(' ')[0] || 'Usuario';
        const apellido = profile.name?.familyName || profile.displayName?.split(' ').slice(1).join(' ') || 'Google';
        const fotoPerfil = profile.photos?.[0]?.value;
        
        try {
            usuario = await Usuario.create({
                nombre,
                apellido,
                email,
                password: Math.random().toString(36).substring(2, 15),
                googleId: profile.id, // Se mapeará a google_id
                providerType: 'google', // Se mapeará a provider_type
                fotoPerfil, // Se mapeará a foto_perfil
                emailVerificado: profile.emails?.[0]?.verified || false, // Se mapeará a email_verificado
                rolId
            });
            
            console.log(`Nuevo usuario creado: ${email} (${nombre} ${apellido})`);
        } catch (error) {
            console.error('Error al crear usuario:', error);
            throw error;
        }
    } 
    // Si existe pero no tiene googleId, actualizarlo
    else if (!usuario.googleId) {
        usuario.googleId = profile.id;
        usuario.providerType = 'google';
        if (!usuario.fotoPerfil && profile.photos?.[0]?.value) {
            usuario.fotoPerfil = profile.photos[0].value;
        }
        await usuario.save();
        console.log(`Usuario existente vinculado con Google: ${email}`);
    }
    
    return usuario;
}
