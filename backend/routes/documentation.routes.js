const router = require("express").Router();

const API_URL = "http://localhost:5000";

const routes = [
    {
        roles: ["admin", "user"],
        method: "POST",
        path: "/auth/login",
        description: "Authentifie un profil et retourne un jeton JWT.",
        curl: `curl -X POST ${API_URL}/auth/login -H "Content-Type: application/json" -d "{\\"email\\":\\"admin@test.com\\",\\"password\\":\\"Secret123\\"}"`,
        response: `{ "token": "jwt..." }`
    },
    {
        roles: ["admin", "user"],
        method: "GET",
        path: "/motdepasse/{longueur}",
        description: "Génère un mot de passe aléatoire de la longueur demandée.",
        curl: `curl ${API_URL}/motdepasse/12`,
        response: `{ "password": "aB8xKp20LmNz" }`
    },
    {
        roles: ["admin", "user"],
        method: "POST",
        path: "/profils",
        description: "Crée un profil après validation du courriel par API REST externe et chiffrement du mot de passe.",
        curl: `curl -X POST ${API_URL}/profils -H "Content-Type: application/json" -d "{\\"pseudo\\":\\"alice\\",\\"email\\":\\"alice@test.com\\",\\"password\\":\\"Secret123\\",\\"isAdmin\\":false}"`,
        response: `{ "_id": "...", "pseudo": "alice", "email": "alice@test.com", "isAdmin": false }`
    },
    {
        roles: ["admin"],
        method: "GET",
        path: "/profils",
        description: "Retourne tous les profils. Réservé aux administrateurs.",
        curl: `curl ${API_URL}/profils -H "Authorization: Bearer {token}"`,
        response: `[{ "_id": "...", "pseudo": "alice", "email": "alice@test.com", "isAdmin": false }]`
    },
    {
        roles: ["admin", "user"],
        method: "GET",
        path: "/profils/{id}",
        description: "Retourne un profil. Un utilisateur normal peut lire seulement son propre profil.",
        curl: `curl ${API_URL}/profils/{id} -H "Authorization: Bearer {token}"`,
        response: `{ "_id": "...", "pseudo": "alice", "email": "alice@test.com", "isAdmin": false }`
    },
    {
        roles: ["admin", "user"],
        method: "PUT",
        path: "/profils/{id}",
        description: "Modifie un profil. Un utilisateur normal peut modifier seulement son propre profil.",
        curl: `curl -X PUT ${API_URL}/profils/{id} -H "Authorization: Bearer {token}" -H "Content-Type: application/json" -d "{\\"pseudo\\":\\"alice2\\"}"`,
        response: `{ "_id": "...", "pseudo": "alice2", "email": "alice@test.com", "isAdmin": false }`
    },
    {
        roles: ["admin"],
        method: "DELETE",
        path: "/profils/{id}",
        description: "Supprime un profil. Résérve aux administrateurs.",
        curl: `curl -X DELETE ${API_URL}/profils/{id} -H "Authorization: Bearer {token}"`,
        response: `{ "message": "deleted" }`
    }
];

const escapeHtml = (value) => {
    return value.replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[char]));
};

const renderRows = (role) => {
    return routes
        .filter((route) => route.roles.includes(role))
        .map((route) => `
            <tr>
                <td><strong>${route.method}</strong></td>
                <td><code>${route.path}</code></td>
                <td>${route.description}</td>
                <td><pre>${escapeHtml(route.curl)}</pre></td>
                <td><pre>${escapeHtml(route.response)}</pre></td>
            </tr>
        `)
        .join("");
};

router.get("/", (req, res) => {
    res.type("html").send(`
        <!doctype html>
        <html lang="fr">
        <head>
            <meta charset="utf-8">
            <title>Documentation API REST</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 32px; color: #1f2933; }
                h1, h2 { margin-bottom: 8px; }
                table { border-collapse: collapse; width: 100%; margin-bottom: 32px; }
                th, td { border: 1px solid #cbd5e1; padding: 10px; vertical-align: top; }
                th { background: #eef2f7; text-align: left; }
                code, pre { font-family: Consolas, monospace; }
                pre { white-space: pre-wrap; margin: 0; }
            </style>
        </head>
        <body>
            <h1>Documentation API REST</h1>
            <p>Les routes retournent des données au format JSON. Les routes protégées utilisent l'entête <code>Authorization: Bearer {token}</code>.</p>

            <h2>Routes administrateur</h2>
            <table>
                <thead>
                    <tr><th>Type</th><th>Route</th><th>Description</th><th>Exemple curl</th><th>Retour JSON</th></tr>
                </thead>
                <tbody>${renderRows("admin")}</tbody>
            </table>

            <h2>Routes utilisateur</h2>
            <table>
                <thead>
                    <tr><th>Type</th><th>Route</th><th>Description</th><th>Exemple curl</th><th>Retour JSON</th></tr>
                </thead>
                <tbody>${renderRows("user")}</tbody>
            </table>
        </body>
        </html>
    `);
});

module.exports = router;
