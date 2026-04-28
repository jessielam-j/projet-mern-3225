const router = require("express").Router();
const ctrl = require("../controllers/auth.controller");

// Le PDF demande l'authentification via cette route
router.post("/login", ctrl.login);

module.exports = router;
