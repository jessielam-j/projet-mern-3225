const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const client = require("@sendgrid/client");

// clé API SendGrid
client.setApiKey(process.env.SENDGRID_API_KEY);


// =======================
// REGISTER
// =======================
exports.register = async (req, res) => {
    try {
        const { pseudo, email, password, isAdmin } = req.body;

        if (!pseudo || !email || !password) {
            return res.status(400).json({ message: "Missing fields" });
        }

        // 1. Vérifier si email déjà utilisé dans la DB
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already used" });
        }

        // 2. Vérifier email via API externe (SendGrid)
        const request = {
            url: "/v3/validations/email",
            method: "POST",
            body: {
                email: email
            }
        };

        const [response, body] = await client.request(request);

        if (body.result.verdict !== "Valid") {
            return res.status(400).json({ message: "Invalid email address" });
        }

        // 3. Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 4. Créer utilisateur
        const user = await User.create({
            pseudo,
            email,
            password: hashedPassword,
            isAdmin: isAdmin || false
        });

        // 5. Ne pas retourner le password
        const { password: _, ...safeUser } = user._doc;

        res.json(safeUser);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


// =======================
// LOGIN
// =======================
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. trouver utilisateur
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // 2. vérifier mot de passe
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(401).json({ message: "Wrong password" });
        }

        // 3. créer token JWT
        const token = jwt.sign(
            { id: user._id, isAdmin: user.isAdmin },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        // 4. envoyer token
        res.json({ token });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};