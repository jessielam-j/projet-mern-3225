import { useMemo, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000";

const emptyProfile = {
  pseudo: "",
  email: "",
  password: "",
  isAdmin: false,
};

const emptyEdit = {
  pseudo: "",
  email: "",
  password: "",
  isAdmin: false,
};

function decodeToken(token) {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(window.atob(payload));
  } catch {
    return null;
  }
}

function App() {
  const [token, setToken] = useState("");
  const [session, setSession] = useState(null);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [createForm, setCreateForm] = useState(emptyProfile);
  const [editForm, setEditForm] = useState(emptyEdit);
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [passwordLength, setPasswordLength] = useState(12);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const isAdmin = Boolean(session?.isAdmin);

  const authHeaders = useMemo(() => ({
    Authorization: `Bearer ${token}`,
  }), [token]);

  const showMessage = (text) => {
    setMessage(text);
    setError("");
  };

  const showError = (text) => {
    setError(text);
    setMessage("");
  };

  async function request(path, options = {}) {
    const response = await fetch(`${API_URL}${path}`, options);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "Une erreur est survenue");
    }

    return data;
  }

  async function createProfile(event) {
    event.preventDefault();

    try {
      const profile = await request("/profils", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });

      setCreateForm(emptyProfile);
      showMessage(`Profil cree pour ${profile.pseudo}`);

      if (isAdmin) {
        await loadAllProfiles();
      }
    } catch (err) {
      showError(err.message);
    }
  }

  async function login(event) {
    event.preventDefault();

    try {
      const data = await request("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });
      const decoded = decodeToken(data.token);

      // Decode le JWT pour connaitre le role et le profil connecte
      setToken(data.token);
      setSession(decoded);
      setLoginForm({ email: "", password: "" });
      showMessage("Connexion reussie");

      if (decoded?.isAdmin) {
        await loadAllProfiles(data.token);
      } else if (decoded?.id) {
        await loadProfile(decoded.id, data.token);
      }
    } catch (err) {
      showError(err.message);
    }
  }

  function logout() {
    setToken("");
    setSession(null);
    setProfiles([]);
    setSelectedProfile(null);
    setEditForm(emptyEdit);
    showMessage("Session fermee");
  }

  async function generatePassword(target) {
    try {
      const data = await request(`/motdepasse/${passwordLength}`);

      // Injecte le mot de passe genere dans le formulaire choisi
      if (target === "edit") {
        setEditForm((form) => ({ ...form, password: data.password }));
      } else {
        setCreateForm((form) => ({ ...form, password: data.password }));
      }
      showMessage("Mot de passe genere");
    } catch (err) {
      showError(err.message);
    }
  }

  async function loadAllProfiles(forcedToken = token) {
    try {
      const data = await request("/profils", {
        headers: { Authorization: `Bearer ${forcedToken}` },
      });

      setProfiles(data);
      showMessage("Profils charges");
    } catch (err) {
      showError(err.message);
    }
  }

  async function loadProfile(id, forcedToken = token) {
    try {
      const data = await request(`/profils/${id}`, {
        headers: { Authorization: `Bearer ${forcedToken}` },
      });

      selectProfile(data);
      showMessage("Profil charge");
    } catch (err) {
      showError(err.message);
    }
  }

  function selectProfile(profile) {
    setSelectedProfile(profile);
    setEditForm({
      pseudo: profile.pseudo || "",
      email: profile.email || "",
      password: "",
      isAdmin: Boolean(profile.isAdmin),
    });
  }

  async function updateProfile(event) {
    event.preventDefault();

    if (!selectedProfile?._id) {
      showError("Aucun profil selectionne");
      return;
    }

    const payload = {
      pseudo: editForm.pseudo,
      email: editForm.email,
      isAdmin: editForm.isAdmin,
    };

    if (editForm.password) {
      payload.password = editForm.password;
    }

    try {
      const updated = await request(`/profils/${selectedProfile._id}`, {
        method: "PUT",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Rafraichit le profil courant sans exposer le mot de passe
      selectProfile(updated);

      if (isAdmin) {
        await loadAllProfiles();
      }

      showMessage("Profil modifie");
    } catch (err) {
      showError(err.message);
    }
  }

  async function deleteProfile(id) {
    try {
      await request(`/profils/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });

      setSelectedProfile(null);
      setEditForm(emptyEdit);
      await loadAllProfiles();
      showMessage("Profil supprime");
    } catch (err) {
      showError(err.message);
    }
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">IFT 3225</p>
          <h1>Gestion de profils</h1>
        </div>
        <a className="doc-link" href={`${API_URL}/documentation`} target="_blank" rel="noreferrer">
          Documentation API
        </a>
      </header>

      {(message || error) && (
        <section className={error ? "notice error" : "notice success"}>
          {error || message}
        </section>
      )}

      <section className="layout-grid">
        <div className="panel">
          <h2>Creer un profil</h2>
          <form onSubmit={createProfile} className="form-grid">
            <label>
              Pseudo
              <input
                value={createForm.pseudo}
                onChange={(event) => setCreateForm({ ...createForm, pseudo: event.target.value })}
                required
              />
            </label>

            <label>
              Courriel
              <input
                type="email"
                value={createForm.email}
                onChange={(event) => setCreateForm({ ...createForm, email: event.target.value })}
                required
              />
            </label>

            <label>
              Mot de passe
              <input
                type="text"
                value={createForm.password}
                onChange={(event) => setCreateForm({ ...createForm, password: event.target.value })}
                required
              />
            </label>

            <label>
              Longueur
              <input
                type="number"
                min="1"
                value={passwordLength}
                onChange={(event) => setPasswordLength(event.target.value)}
              />
            </label>

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={createForm.isAdmin}
                onChange={(event) => setCreateForm({ ...createForm, isAdmin: event.target.checked })}
              />
              Administrateur
            </label>

            <div className="button-row">
              <button type="button" className="secondary" onClick={() => generatePassword("create")}>
                Generer
              </button>
              <button type="submit">Creer</button>
            </div>
          </form>
        </div>

        <div className="panel">
          <h2>Connexion</h2>
          {!token ? (
            <form onSubmit={login} className="form-grid">
              <label>
                Courriel
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })}
                  required
                />
              </label>

              <label>
                Mot de passe
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
                  required
                />
              </label>

              <button type="submit">Se connecter</button>
            </form>
          ) : (
            <div className="session-box">
              <p>
                Connecte comme <strong>{isAdmin ? "administrateur" : "utilisateur"}</strong>
              </p>
              <div className="button-row">
                {isAdmin && (
                  <button type="button" onClick={() => loadAllProfiles()}>
                    Charger les profils
                  </button>
                )}
                {!isAdmin && session?.id && (
                  <button type="button" onClick={() => loadProfile(session.id)}>
                    Mon profil
                  </button>
                )}
                <button type="button" className="secondary" onClick={logout}>
                  Deconnexion
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="workspace-grid">
        <div className="panel wide">
          <div className="panel-title-row">
            <h2>{isAdmin ? "Profils" : "Profil"}</h2>
            {isAdmin && (
              <button type="button" className="secondary" onClick={() => loadAllProfiles()}>
                Actualiser
              </button>
            )}
          </div>

          {isAdmin ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Pseudo</th>
                    <th>Courriel</th>
                    <th>Role</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((profile) => (
                    <tr key={profile._id}>
                      <td>{profile.pseudo}</td>
                      <td>{profile.email}</td>
                      <td>{profile.isAdmin ? "Admin" : "Utilisateur"}</td>
                      <td>
                        <div className="table-actions">
                          <button type="button" className="secondary" onClick={() => selectProfile(profile)}>
                            Ouvrir
                          </button>
                          <button type="button" className="danger" onClick={() => deleteProfile(profile._id)}>
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {profiles.length === 0 && <p className="empty-state">Aucun profil charge</p>}
            </div>
          ) : (
            <div className="profile-summary">
              {selectedProfile ? (
                <>
                  <p><strong>Pseudo:</strong> {selectedProfile.pseudo}</p>
                  <p><strong>Courriel:</strong> {selectedProfile.email}</p>
                  <p><strong>Role:</strong> {selectedProfile.isAdmin ? "Admin" : "Utilisateur"}</p>
                </>
              ) : (
                <p className="empty-state">Connecte-toi pour charger ton profil</p>
              )}
            </div>
          )}
        </div>

        <div className="panel">
          <h2>Modifier</h2>
          <form onSubmit={updateProfile} className="form-grid">
            <label>
              Pseudo
              <input
                value={editForm.pseudo}
                onChange={(event) => setEditForm({ ...editForm, pseudo: event.target.value })}
                disabled={!selectedProfile}
                required
              />
            </label>

            <label>
              Courriel
              <input
                type="email"
                value={editForm.email}
                onChange={(event) => setEditForm({ ...editForm, email: event.target.value })}
                disabled={!selectedProfile}
                required
              />
            </label>

            <label>
              Nouveau mot de passe
              <input
                type="text"
                value={editForm.password}
                onChange={(event) => setEditForm({ ...editForm, password: event.target.value })}
                disabled={!selectedProfile}
              />
            </label>

            {isAdmin && (
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={editForm.isAdmin}
                  onChange={(event) => setEditForm({ ...editForm, isAdmin: event.target.checked })}
                  disabled={!selectedProfile}
                />
                Administrateur
              </label>
            )}

            <div className="button-row">
              <button type="button" className="secondary" onClick={() => generatePassword("edit")} disabled={!selectedProfile}>
                Generer
              </button>
              <button type="submit" disabled={!selectedProfile || !token}>
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}

export default App;
