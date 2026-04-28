const User = require("../models/User");
const bcrypt = require("bcrypt");

const hasEmailValidationKey = () => {
    return Boolean(process.env.EMAIL_VALIDATION_API_KEY);
};

// Retire le mot de passe avant de renvoyer un profil au client
const sanitizeUser = (user) => {
    if (!user) return null;
    const data = user.toObject ? user.toObject() : user;
    delete data.password;
    return data;
};

// Valide que le courriel existe vraiment avec l'API externe demandee
const validateEmail = async (email) => {
    if (!hasEmailValidationKey()) {
        throw new Error("EMAIL_VALIDATION_API_KEY est manquant dans .env");
    }

    const params = new URLSearchParams({
        api_key: process.env.EMAIL_VALIDATION_API_KEY,
        email_address: email,
        timeout: "20"
    });

    const response = await fetch(`https://api.zeruh.com/v1/verify?${params.toString()}`);

    const body = await response.json();

    if (!response.ok) {
        throw new Error(body.message || "Email validation failed");
    }

    return body.success && body.result && body.result.status === "deliverable";
};

// Un admin peut acceder a tous les profils; un utilisateur seulement au sien
const canAccessProfile = (req, profileId) => {
    return req.user.isAdmin || req.user.id === profileId;
};

exports.createUser = async (req, res) => {
    try {
        const { pseudo, email, password, isAdmin } = req.body;

        if (!pseudo || !email || !password) {
            return res.status(400).json({ message: "pseudo, email and password are required" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already used" });
        }

        const validEmail = await validateEmail(email);
        if (!validEmail) {
            return res.status(400).json({ message: "Invalid email address" });
        }

        // Le mot de passe est toujours chiffre avant l'enregistrement
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            pseudo,
            email,
            password: hashedPassword,
            isAdmin: Boolean(isAdmin)
        });

        res.status(201).json(sanitizeUser(user));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().select("-password");
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getUser = async (req, res) => {
    try {
        if (!canAccessProfile(req, req.params.id)) {
            return res.status(403).json({ message: "Forbidden" });
        }

        const user = await User.findById(req.params.id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        if (!canAccessProfile(req, req.params.id)) {
            return res.status(403).json({ message: "Forbidden" });
        }

        const currentUser = await User.findById(req.params.id);
        if (!currentUser) {
            return res.status(404).json({ message: "User not found" });
        }

        const updates = { ...req.body };
        delete updates._id;

        if (!req.user.isAdmin) {
            // Evite qu'un utilisateur normal puisse se donner le role admin
            delete updates.isAdmin;
        }

        if (updates.email && updates.email !== currentUser.email) {
            const existingUser = await User.findOne({ email: updates.email });
            if (existingUser) {
                return res.status(400).json({ message: "Email already used" });
            }

            const validEmail = await validateEmail(updates.email);
            if (!validEmail) {
                return res.status(400).json({ message: "Invalid email address" });
            }
        }

        if (updates.password) {
            // Si le mot de passe change, on enregistre uniquement sa version chiffree
            updates.password = await bcrypt.hash(updates.password, 10);
        }

        const user = await User.findByIdAndUpdate(req.params.id, updates, {
            new: true,
            runValidators: true
        }).select("-password");

        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ message: "deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
