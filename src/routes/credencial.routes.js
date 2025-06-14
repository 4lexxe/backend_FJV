const credencialCtrl = require("./../controllers/credencial.controller");
const express = require("express");
const router = express.Router();

router.get("/", credencialCtrl.getCredenciales);
router.get("/:id", credencialCtrl.getCredencial);
router.post("/", credencialCtrl.createCredencial);
router.put("/:id", credencialCtrl.updateCredencial);
router.delete("/:id", credencialCtrl.deleteCredencial);

module.exports = router;
