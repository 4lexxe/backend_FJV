const Cobro = require("./../models/Cobro");
const Club = require("./../models/Club");

const cobroCtrl = {};

cobroCtrl.getCobros = async (req, res) => {
  try {
    const cobros = await Cobro.findAll({
      include: {
        model: Club,
        attributes: ["nombre"],
      },
    });
    res.json(cobros);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error al obtener cobros", detalle: error.message });
  }
};

cobroCtrl.getCobro = async (req, res) => {
  try {
    const cobro = await Cobro.findOne({
      where: { id: req.params.id },
      include: {
        model: Club,
        attributes: ["nombre"],
      },
    });

    if (!cobro) return res.status(404).json({ error: "Cobro no encontrado" });

    res.json(cobro);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error al obtener el cobro", detalle: error.message });
  }
};
cobroCtrl.createCobro = async (req, res) => {
  try {
    const nuevo = await Cobro.create(req.body);
    res.status(201).json(nuevo);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error al crear el cobro", detalle: error.message });
  }
};
cobroCtrl.updateCobro = async (req, res) => {
  try {
    const cobro = await Cobro.findByPk(req.params.id);
    if (!cobro) return res.status(404).json({ error: "Cobro no encontrado" });

    await cobro.update(req.body);
    res.json(cobro);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error al actualizar el cobro", detalle: error.message });
  }
};
cobroCtrl.deleteCobro = async (req, res) => {
  try {
    const cobro = await Cobro.findByPk(req.params.id);
    if (!cobro) return res.status(404).json({ error: "Cobro no encontrado" });

    await cobro.update({ estado: "PAGADO" });
    res.json({ mensaje: "Cobro marcado como PAGADO" });
  } catch (error) {
    res
      .status(500)
      .json({
        error: "Error al eliminar lógicamente el cobro",
        detalle: error.message,
      });
  }
};

module.exports = cobroCtrl;
