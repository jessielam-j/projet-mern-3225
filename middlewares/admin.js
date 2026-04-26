module.exports = (req, res, next) => {
    try {
        // req.user vient du middleware auth.js
        if (!req.user) {
            return res.status(401).json({ message: "Not authenticated" });
        }

        if (!req.user.isAdmin) {
            return res.status(403).json({ message: "Admin access only" });
        }

        next();

    } catch (err) {
        return res.status(500).json({ message: "Server error" });
    }
};