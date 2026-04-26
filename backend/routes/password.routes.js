const router = require("express").Router();

// GET /motdepasse/:longueur
router.get("/:longueur", (req, res) => {
    const length = parseInt(req.params.longueur);

    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    let password = "";

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        password += chars[randomIndex];
    }

    res.json({ password });
});

module.exports = router;