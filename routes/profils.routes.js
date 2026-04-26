const router = require("express").Router();
const ctrl = require("../controllers/profils.controller");

// GET tous les profils
router.get("/", ctrl.getUsers);

// GET un profil
router.get("/:id", ctrl.getUser);

// POST création utilisateur
router.post("/", ctrl.createUser);

// PUT modification
router.put("/:id", ctrl.updateUser);

// DELETE suppression
router.delete("/:id", ctrl.deleteUser);

module.exports = router;