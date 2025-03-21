const express = require("express");
const session = require("express-session");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: "super-secret-key",
    resave: false,
    saveUninitialized: true,
    name: "chatSession",
    store: new session.MemoryStore()
}));

const USERS_FILE = path.join(__dirname, "users.json");
const MESSAGES_FILE = path.join(__dirname, "messages.json");
const LOGS_FILE = path.join(__dirname, "admin-logs.json");
const SETTINGS_FILE = path.join(__dirname, "settings.json");

const initializeFile = (filePath, defaultContent) => {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(defaultContent, null, 2));
    }
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
};

let defaultSettings = { theme: "light", pinnedMessage: null, chatLocked: false, autoMod: { maxMessages: 10 }, groups: {}, timer: null };
let settings = initializeFile(SETTINGS_FILE, defaultSettings);
if (!settings.autoMod) settings.autoMod = { maxMessages: 10 };

let users = initializeFile(USERS_FILE, { "admin": { password: "admin123", role: "admin" } });
let messages = initializeFile(MESSAGES_FILE, []);
let adminLogs = initializeFile(LOGS_FILE, []);

const logAdminAction = (action, details) => {
    adminLogs.push({ timestamp: new Date().toISOString(), action, details });
    fs.writeFileSync(LOGS_FILE, JSON.stringify(adminLogs, null, 2));
};

const updateLastActivity = (username) => {
    if (users[username]) {
        users[username].lastActivity = new Date().toISOString();
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    }
};

const updateUserSession = (username, newData, destroy) => {
    const sessionId = users[username] && users[username].sessionId ? users[username].sessionId : null;
    if (sessionId && app.get("sessionStore")) {
        app.get("sessionStore").get(sessionId, (err, session) => {
            if (err || !session) return;
            if (destroy) {
                app.get("sessionStore").destroy(sessionId, (err) => {
                    if (err) console.error("Fehler beim Zerstören der Session:", err);
                    if (users[username]) {
                        delete users[username].sessionId;
                        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
                    }
                });
            } else {
                session.user = { ...session.user, ...newData };
                app.get("sessionStore").set(sessionId, session, (err) => {
                    if (err) console.error("Fehler beim Aktualisieren der Session:", err);
                });
            }
        });
    }
};

// Login-Seite
app.get("/", (req, res) => {
    if (req.session.user) return res.redirect("/chat");
    res.sendFile(path.join(__dirname, "public/index.html"));
});

// Login
app.post("/login", (req, res) => {
    const { username, password } = req.body;
    const user = users[username];
    if (user && user.password === password && !user.banned && (!user.bannedUntil || new Date(user.bannedUntil) < new Date())) {
        req.session.user = { username, role: user.role, loggedIn: true };
        user.lastIp = req.ip || "simulated-ip";
        user.loginHistory = user.loginHistory || [];
        user.loginHistory.push(new Date().toISOString());
        user.sessionId = req.sessionID;
        updateLastActivity(username);
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
        logAdminAction("login", `${username} logged in`);
        return res.json({ success: true, role: user.role });
    }
    res.json({ success: false, message: "Falsche Anmeldedaten oder gebannt!" });
});

// Chat-Seite
app.get("/chat", (req, res) => {
    if (!req.session.user) return res.redirect("/");
    res.sendFile(path.join(__dirname, "public/chat.html"));
});

// Logout
app.post("/logout", (req, res) => {
    if (req.session.user) {
        const username = req.session.user.username;
        req.session.destroy(() => {
            if (users[username]) {
                delete users[username].sessionId;
                fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
            }
            res.json({ success: true, message: "Ausgeloggt." });
        });
    } else {
        res.json({ success: false, message: "Nicht eingeloggt!" });
    }
});

// Rolle prüfen
app.get("/check-role", (req, res) => {
    if (!req.session.user) return res.status(401).json({ success: false, role: "none" });
    res.json({ success: true, role: req.session.user.role });
});

// Nachrichten senden
app.post("/send-message", (req, res) => {
    if (!req.session.user || users[req.session.user.username].muted || settings.chatLocked) {
        return res.status(403).json({ success: false, message: "Keine Berechtigung!" });
    }
    const { content } = req.body;
    const userMessages = messages.filter(m => m.username === req.session.user.username).length;
    const maxMessages = settings.autoMod.maxMessages || 10;
    if (userMessages >= maxMessages) return res.json({ success: false, message: "Nachrichtenlimit erreicht!" });
    const filteredContent = filterWords(content);
    const message = { id: messages.length, username: req.session.user.username, content: filteredContent, timestamp: new Date().toISOString() };
    messages.push(message);
    updateLastActivity(req.session.user.username);
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
    res.json({ success: true });
});

// Nachrichten laden
app.get("/messages", (req, res) => {
    if (!req.session.user) return res.status(403).json({ success: false });
    res.json({ messages, pinnedMessage: settings.pinnedMessage, theme: settings.theme });
});

// Benutzerstatus
app.get("/admin/users-status", (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") return res.status(403).json({ success: false });
    const userList = Object.keys(users).map(username => ({
        username,
        role: users[username].role,
        online: !!users[username].sessionId,
        tags: users[username].tags || [],
        verified: users[username].verified || false,
        group: users[username].group || ""
    }));
    res.json({ success: true, users: userList, groups: settings.groups });
});

// Admin: Benutzer hinzufügen
app.post("/add-user", (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") return res.status(403).json({ success: false });
    const { username, password, role, group } = req.body;
    if (users[username]) return res.json({ success: false, message: "Benutzer existiert bereits!" });
    users[username] = { password, role: role || "user", group: group || "" };
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    logAdminAction("add-user", `${username} added as ${role}`);
    res.json({ success: true, message: `${username} hinzugefügt.` });
});

// Admin: Benutzer löschen
app.post("/delete-user", (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") return res.status(403).json({ success: false });
    const { username } = req.body;
    if (!users[username]) return res.json({ success: false, message: "Benutzer nicht gefunden!" });
    updateUserSession(username, null, true);
    delete users[username];
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    logAdminAction("delete-user", `${username} deleted`);
    res.json({ success: true, message: `${username} gelöscht.` });
});

// Admin: Bann
app.post("/ban", (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") return res.status(403).json({ success: false });
    const { username } = req.body;
    if (!users[username]) return res.json({ success: false, message: "Benutzer nicht gefunden!" });
    users[username].banned = true;
    updateUserSession(username, null, true);
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    logAdminAction("ban", `${username} banned`);
    res.json({ success: true, message: `${username} wurde gebannt und ausgeloggt.` });
});

// Admin: Entbannen
app.post("/unban", (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") return res.status(403).json({ success: false });
    const { username } = req.body;
    if (!users[username]) return res.json({ success: false, message: "Benutzer nicht gefunden!" });
    users[username].banned = false;
    delete users[username].bannedUntil;
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    logAdminAction("unban", `${username} unbanned`);
    res.json({ success: true, message: `${username} wurde entbannt.` });
});

// Admin: Rolle ändern
app.post("/change-role", (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") return res.status(403).json({ success: false });
    const { username, role } = req.body;
    if (!users[username]) return res.json({ success: false, message: "Benutzer nicht gefunden!" });
    if (role !== "user" && role !== "admin") return res.json({ success: false, message: "Ungültige Rolle!" });
    users[username].role = role;
    updateUserSession(username, { role });
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    logAdminAction("change-role", `${username}'s role changed to ${role}`);
    res.json({ success: true, message: `Rolle von ${username} zu ${role} geändert.` });
});

// Admin: Passwort ändern
app.post("/change-password", (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") return res.status(403).json({ success: false });
    const { username, newPassword } = req.body;
    if (!users[username]) return res.json({ success: false, message: "Benutzer nicht gefunden!" });
    users[username].password = newPassword;
    updateUserSession(username, null, true);
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    logAdminAction("change-password", `${username}'s password changed`);
    res.json({ success: true, message: `Passwort von ${username} geändert, Benutzer ausgeloggt.` });
});

// Admin: Stummschalten
app.post("/mute", (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") return res.status(403).json({ success: false });
    const { username } = req.body;
    if (!users[username]) return res.json({ success: false, message: "Benutzer nicht gefunden!" });
    users[username].muted = true;
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    logAdminAction("mute", `${username} muted`);
    res.json({ success: true, message: `${username} wurde stummgeschaltet.` });
});

// Admin: Entstummen
app.post("/unmute", (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") return res.status(403).json({ success: false });
    const { username } = req.body;
    if (!users[username]) return res.json({ success: false, message: "Benutzer nicht gefunden!" });
    users[username].muted = false;
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    logAdminAction("unmute", `${username} unmuted`);
    res.json({ success: true, message: `${username} wurde entstummt.` });
});

// Admin: Temporärer Bann
app.post("/temp-ban", (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") return res.status(403).json({ success: false });
    const { username, duration } = req.body;
    if (!users[username]) return res.json({ success: false, message: "Benutzer nicht gefunden!" });
    const banUntil = new Date(Date.now() + duration * 60 * 1000).toISOString();
    users[username].bannedUntil = banUntil;
    updateUserSession(username, null, true);
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    logAdminAction("temp-ban", `${username} banned until ${banUntil}`);
    res.json({ success: true, message: `${username} wurde für ${duration} Minuten gebannt.` });
});

// Admin: IP-Bann
app.post("/ip-ban", (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") return res.status(403).json({ success: false });
    const { username } = req.body;
    if (!users[username]) return res.json({ success: false, message: "Benutzer nicht gefunden!" });
    users[username].bannedIp = users[username].lastIp || "simulated-ip";
    updateUserSession(username, null, true);
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    logAdminAction("ip-ban", `${username} IP-banned`);
    res.json({ success: true, message: `${username} wurde per IP gebannt.` });
});

// Admin: Chat sperren
app.post("/lock-chat", (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") return res.status(403).json({ success: false });
    settings.chatLocked = true;
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    logAdminAction("lock-chat", "Chat locked");
    res.json({ success: true, message: "Chat wurde gesperrt." });
});

// Admin: Chat entsperren
app.post("/unlock-chat", (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") return res.status(403).json({ success: false });
    settings.chatLocked = false;
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    logAdminAction("unlock-chat", "Chat unlocked");
    res.json({ success: true, message: "Chat wurde entsperrt." });
});

// Admin: Chat leeren
app.post("/clear-chat", (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") return res.status(403).json({ success: false });
    messages = [];
    settings.pinnedMessage = null;
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    logAdminAction("clear-chat", "Chat cleared");
    res.json({ success: true, message: "Chat wurde geleert." });
});

// Admin: Nachricht bearbeiten
app.post("/edit-message", (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") return res.status(403).json({ success: false });
    const { id, content } = req.body;
    const msg = messages.find(m => m.id === parseInt(id));
    if (!msg) return res.json({ success: false, message: "Nachricht nicht gefunden!" });
    msg.content = content;
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
    logAdminAction("edit-message", `Message ${id} edited`);
    res.json({ success: true, message: "Nachricht bearbeitet." });
});

// Admin: Nachricht anpinnen
app.post("/pin-message", (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") return res.status(403).json({ success: false });
    const { id } = req.body;
    const msg = messages.find(m => m.id === parseInt(id));
    if (!msg) return res.json({ success: false, message: "Nachricht nicht gefunden!" });
    settings.pinnedMessage = { id: msg.id, content: msg.content, username: msg.username };
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    logAdminAction("pin-message", `Message ${id} pinned`);
    res.json({ success: true, message: "Nachricht angepinnt." });
});

// Admin: Ankündigung senden
app.post("/send-announcement", (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") return res.status(403).json({ success: false });
    const { content } = req.body;
    const message = { id: messages.length, username: "System", content: `[Ankündigung] ${content}`, timestamp: new Date().toISOString() };
    messages.push(message);
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
    logAdminAction("announcement", `Announcement sent: ${content}`);
    res.json({ success: true, message: "Ankündigung gesendet." });
});

// Filter für Nachrichten
const filterWords = (text) => {
    const badWords = ["idiot", "dumm"];
    return badWords.reduce((acc, word) => acc.replace(new RegExp(word, "gi"), "***"), text);
};

app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));