const Credencial = require("./../models/Credencial");
const Persona = require("./../models/Persona");

const credencialCtrl = {};

credencialCtrl.getCredenciales = async (req, res) => {
  try {
    const credenciales = await Credencial.findAll({
      where: { estado: "ACTIVO" },
      include: {
        model: Persona,
        attributes: ["nombreApellido", "dni", "fechaNacimiento"],
      },
    });
    res.json(credenciales);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error al obtener credenciales", detalle: error.message });
  }
};

credencialCtrl.getCredencial = async (req, res) => {
  try {
    const credencial = await Credencial.findOne({
      where: { id: req.params.id },
      include: {
        model: Persona,
        attributes: ["nombreApellido", "dni", "fechaNacimiento"],
      },
    });

    if (!credencial) return res.status(404).json({ error: "No encontrada" });

    res.json(credencial);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error al obtener credencial", detalle: error.message });
  }
};

credencialCtrl.createCredencial = async (req, res) => {
  try {
    const { idPersona, fechaEmision, fechaVencimiento, codigoQR } = req.body;

    const persona = await Persona.findByPk(idPersona);
    if (!persona || !["Jugador", "Entrenado"].includes(persona.tipo)) {
      return res.status(400).json({
        error: "Solo jugadores o entrenadores pueden tener credenciales",
      });
    }

    const nueva = await Credencial.create({
      idPersona,
      fechaEmision,
      fechaVencimiento,
      codigoQR,
    });
    res.status(201).json(nueva);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error al crear credencial", detalle: error.message });
  }
};

credencialCtrl.updateCredencial = async (req, res) => {
  try {
    const { fechaEmision, fechaVencimiento, codigoQR, estado } = req.body;

    const credencial = await Credencial.findByPk(req.params.id);
    if (!credencial) return res.status(404).json({ error: "No encontrada" });

    await credencial.update({
      fechaEmision,
      fechaVencimiento,
      codigoQR,
      estado,
    });
    res.json(credencial);
  } catch (error) {
    res.status(500).json({
      error: "Error al actualizar credencial",
      detalle: error.message,
    });
  }
};

credencialCtrl.deleteCredencial = async (req, res) => {
  try {
    const credencial = await Credencial.findByPk(req.params.id);
    if (!credencial) return res.status(404).json({ error: "No encontrada" });

    await credencial.update({ estado: "INACTIVO" });
    res.json({ mensaje: "Credencial desactivada correctamente" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error al eliminar credencial", detalle: error.message });
  }
};

module.exports = credencialCtrl;
