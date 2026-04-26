const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connexion MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.log(err));

// Routes
app.use("/profils", require("./routes/profils.routes"));

app.use("/motdepasse", require("./routes/password.routes"));

app.use("/auth", require("./routes/auth.router"));
// Test route
app.get("/", (req, res) => {
    res.send("API is running");
});

// Lancer serveur
app.listen(5000, () => {
    console.log("Server running on port 5000");
});



app.use((err, req, res, next) => {
    res.status(500).json({ message: err.message });
});

