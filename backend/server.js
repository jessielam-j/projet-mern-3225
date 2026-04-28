const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const dns = require("dns");

require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const PORT = process.env.PORT || 5000;

// Force Node a utiliser des DNS capables de resoudre les URI Atlas en mongodb+srv
dns.setServers(["8.8.8.8", "1.1.1.1"]);

// Autorise le frontend React a appeler l'API Express
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");

    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }

    next();
});

app.use(express.json());

// Routes
app.use("/profils", require("./routes/profils.routes"));

app.use("/motdepasse", require("./routes/password.routes"));

app.use("/auth", require("./routes/auth.router"));

app.use("/documentation", require("./routes/documentation.routes"));

// Test route
app.get("/", (req, res) => {
    res.send("API is running");
});

app.use((err, req, res, next) => {
    res.status(500).json({ message: err.message });
});

async function startServer() {
    if (!process.env.MONGO_URI) {
        console.error("MONGO_URI est manquant dans .env");
        process.exit(1);
    }

    try {
        // Le serveur demarre seulement si MongoDB est accessible
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected");

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (err) {
        console.error("MongoDB connection failed");

        if (process.env.MONGO_URI.includes("localhost") || process.env.MONGO_URI.includes("127.0.0.1")) {
            console.error("Ton MONGO_URI pointe vers MongoDB local, mais aucun serveur local ne repond sur le port 27017");
        }

        console.error(err.message);
        process.exit(1);
    }
}

startServer();
