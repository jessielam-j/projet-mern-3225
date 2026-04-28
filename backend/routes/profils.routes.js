const router = require("express").Router();
const ctrl = require("../controllers/profils.controller");
const auth = require("../middlewares/auth");
const admin = require("../middlewares/admin");

// GET tous les profils - administrateurs seulement
router.get("/", auth, admin, ctrl.getUsers);

// GET un profil - administrateur ou proprietaire du profil
router.get("/:id", auth, ctrl.getUser);

// POST creation utilisateur
router.post("/", ctrl.createUser);

// PUT modification - administrateur ou proprietaire du profil
router.put("/:id", auth, ctrl.updateUser);

// DELETE suppression - administrateurs seulement
router.delete("/:id", auth, admin, ctrl.deleteUser);

module.exports = router;
