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
    saveUninitialized: true
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

let defaultSettings = { theme: "light", pinnedMessage: null, chatLocked: false, autoMod: { maxMessages: 10 }, groups: {} };
let settings = initializeFile(SETTINGS_FILE, defaultSettings);
if (!settings.autoMod) {
    settings.autoMod = { maxMessages: 10 };
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

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

app.post("/login", (req, res) => {
    const { username, password } = req.body;
    console.log("Login-Anfrage:", { username, password });
    const user = users[username];
    if (user && user.password === password && !user.banned && (!user.bannedUntil || new Date(user.bannedUntil) < new Date())) {
        req.session.user = { username, role: user.role, loggedIn: true };
        user.lastIp = req.ip || "simulated-ip";
        user.loginHistory = user.loginHistory || [];
        user.loginHistory.push(new Date().toISOString());
        updateLastActivity(username);
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
        logAdminAction("login", `${username} logged in`);
        return res.json({ success: true, role: user.role });
    }
    res.json({ success: false, message: "Falsche Anmeldedaten oder gebannt!" });
});

app.get("/chat", (req, res) => {
    if (!req.session.user) return res.redirect("/");
    res.sendFile(path.join(__dirname, "public/chat.html"));
});

app.get("/check-role", (req, res) => {
    if (!req.session.user) return res.status(401).json({ success: false, role: "none" });
    res.json({ success: true, role: req.session.user.role });
});

app.get("/users", (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") return res.status(403).json({ success: false });
    res.json({ success: true, users });
});

app.get("/messages", (req, res) => {
    if (!req.session.user) {
        console.log("Zugriff auf /messages ohne Session");
        return res.status(401).json({ success: false, message: "Nicht eingeloggt!" });
    }
    console.log("Nachrichten gesendet an Client:", messages);
    res.json({ success: true, messages: messages.filter(m => !m.censored), pinnedMessage: settings.pinnedMessage });
});

app.post("/send-message", (req, res) => {
    if (!req.session.user || users[req.session.user.username].muted || settings.chatLocked) {
        console.log("Nachricht abgelehnt:", req.session.user);
        return res.status(403).json({ success: false, message: "Keine Berechtigung!" });
    }
    const { content } = req.body;
    const userMessages = messages.filter(m => m.username === req.session.user.username).length;
    const maxMessages = (settings.autoMod && settings.autoMod.maxMessages) ? settings.autoMod.maxMessages : 10;
    if (maxMessages && userMessages >= maxMessages) {
        return res.json({ success: false, message: "Nachrichtenlimit erreicht!" });
    }
    const filteredContent = filterWords(content);
    const message = { id: messages.length, username: req.session.user.username, content: filteredContent, timestamp: new Date().toISOString() };
    messages.push(message);
    updateLastActivity(req.session.user.username);
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
    console.log("Nachricht hinzugefügt:", message);
    res.json({ success: true });
});

app.get("/admin/users-status", (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") {
        return res.status(403).json({ success: false, message: "Nur für Admins!" });
    }
    const userStatus = Object.keys(users).map(username => {
        const lastActivity = users[username].lastActivity;
        const isOnline = lastActivity && (Date.now() - new Date(lastActivity)) < 5 * 60 * 1000;
        return { username, isOnline };
    });
    res.json({ success: true, users: userStatus });
});

app.post("/ban", (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") return res.status(403).json({ success: false });
    const { username } = req.body;
    if (!users[username]) return res.json({ success: false, message: "Benutzer nicht gefunden!" });
    users[username].banned = true;
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    logAdminAction("ban", `${username} banned`);
    res.json({ success: true, message: `${username} wurde gebannt.` });
});

app.post("/unban", (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") return res.status(403).json({ success: false });
    const { username } = req.body;
    if (!users[username]) return res.json({ success: false, message: "Benutzer nicht gefunden!" });
    users[username].banned = false;
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    logAdminAction("unban", `${username} unbanned`);
    res.json({ success: true, message: `${username} wurde entbannt.` });
});

app.post("/add-user", (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") return res.status(403).json({ success: false });
    const { username, password, role } = req.body;
    if (users[username]) return res.json({ success: false, message: "Benutzer existiert bereits!" });
    users[username] = { password, role: role || "user", banned: false };
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    logAdminAction("add-user", `${username} added`);
    res.json({ success: true, message: `${username} wurde hinzugefügt.` });
});

app.post("/delete-user", (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") return res.status(403).json({ success: false });
    const { username } = req.body;
    if (!users[username]) return res.json({ success: false, message: "Benutzer nicht gefunden!" });
    if (username === req.session.user.username) return res.json({ success: false, message: "Du kannst dich nicht selbst löschen!" });
    delete users[username];
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    logAdminAction("delete-user", `${username} deleted`);
    res.json({ success: true, message: `${username} wurde gelöscht.` });
});

app.post("/change-role", (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") return res.status(403).json({ success: false });
    const { username, newRole } = req.body;
    if (!users[username]) return res.json({ success: false, message: "Benutzer nicht gefunden!" });
    if (!["user", "admin"].includes(newRole)) return res.json({ success: false, message: "Ungültige Rolle!" });
    users[username].role = newRole;
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    logAdminAction("change-role", `${username}'s role changed to ${newRole}`);
    res.json({ success: true, message: `Rolle von ${username} wurde zu ${newRole} geändert.` });
});

app.post("/change-password", (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") return res.status(403).json({ success: false });
    const { username, newPassword } = req.body;
    if (!users[username]) return res.json({ success: false, message: "Benutzer nicht gefunden!" });
    users[username].password = newPassword;
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    logAdminAction("change-password", `${username}'s password changed`);
    res.json({ success: true, message: `${username}'s Passwort wurde geändert.` });
});

app.post("/mute", (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") return res.status(403).json({ success: false });
    const { username } = req.body;
    if (!users[username]) return res.json({ success: false, message: "Benutzer nicht gefunden!" });
    users[username].muted = true;
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    logAdminAction("mute", `${username} muted`);
    res.json({ success: true, message: `${username} wurde stummgeschaltet.` });
});

app.post("/unmute", (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") return res.status(403).json({ success: false });
    const { username } = req.body;
    if (!users[username]) return res.json({ success: false, message: "Benutzer nicht gefunden!" });
    users[username].muted = false;
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    logAdminAction("unmute", `${username} unmuted`);
    res.json({ success: true, message: `${username} wurde entstummt.` });
});

app.post("/temp-ban", (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") return res.status(403).json({ success: false });
    const { username, duration } = req.body;
    if (!users[username]) return res.json({ success: false, message: "Benutzer nicht gefunden!" });
    users[username].bannedUntil = new Date(Date.now() + duration * 60000).toISOString();
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    logAdminAction("temp-ban", `${username} banned for ${duration} minutes`);
    res.json({ success: true, message: `${username} wurde für ${duration} Minuten gebannt.` });
});

app.post("/rename-user", (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") return res.status(403).json({ success: false });
    const { oldUsername, newUsername } = req.body;
    if (!users[oldUsername] || users[newUsername]) return res.json({ success: false, message: "Ungültige Umbenennung!" });
    users[newUsername] = { ...users[oldUsername] };
    delete users[oldUsername];
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    logAdminAction("rename", `${oldUsername} renamed to ${newUsername}`);
    res.json({ success: true, message: `${oldUsername} wurde zu ${newUsername} umbenannt.` });
});

app.get("/admin-logs", (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") return res.status(403).json({ success: false });
    res.json({ success: true, logs: adminLogs });
});

app.post("/edit-message", (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") return res.status(403).json({ success: false });
    const { messageId, newContent } = req.body;
    const message = messages.find(m => m.id === messageId);
    if (!message) return res.json({ success: false, message: "Nachricht nicht gefunden!" });
    message.content = newContent;
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
    logAdminAction("edit-message", `Message ${messageId} edited`);
    res.json({ success: true, message: "Nachricht bearbeitet." });
});

app.post("/announcement", (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") return res.status(403).json({ success: false });
    const { content } = req.body;
    const announcement = { id: messages.length, username: "System", content, timestamp: new Date().toISOString(), isAnnouncement: true };
    messages.push(announcement);
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
    logAdminAction("announcement", `Announcement: ${content}`);
    res.json({ success: true, message: "Ankündigung gesendet." });
});

app.get("/user-info", (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") return res.status(403).json({ success: false });
    const { username } = req.query;
    if (!users[username]) return res.json({ success: false, message: "Benutzer nicht gefunden!" });
    res.json({ success: true, info: users[username] });
});

app.post("/clear-chat", (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") return res.status(403).json({ success: false });
    messages = [];
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
    logAdminAction("clear-chat", "Chat cleared");
    res.json({ success: true, message: "Chat wurde geleert." });
});

app.post("/ip-ban", (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") return res.status(403).json({ success: false });
    const { username } = req.body;
    if (!users[username]) return res.json({ success: false, message: "Benutzer nicht gefunden!" });
    users[username].ipBanned = true;
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    logAdminAction("ip-ban", `${username} IP-banned`);
    res.json({ success: true, message: `${username} wurde per IP gebannt.` });
});

app.post("/change-theme", (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") return res.status(403).json({ success: false });
    const { theme } = req.body;
    settings.theme = theme;
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    logAdminAction("change-theme", `Theme changed to ${theme}`);
    res.json({ success: true, message: `Thema zu ${theme} geändert.` });
});

app.post("/pin-message", (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") return res.status(403).json({ success: false });
    const { messageId } = req.body;
    const message = messages.find(m => m.id === messageId);
    if (!message) return res.json({ success: false, message: "Nachricht nicht gefunden!" });
    settings.pinnedMessage = message;
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    logAdminAction("pin-message", `Message ${messageId} pinned`);
    res.json({ success: true, message: "Nachricht angepinnt." });
});

app.post("/timeout", (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") return res.status(403).json({ success: false });
    const { username, duration } = req.body;
    if (!users[username]) return res.json({ success: false, message: "Benutzer nicht gefunden!" });
    users[username].timeoutUntil = new Date(Date.now() + duration * 60000).toISOString();
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    logAdminAction("timeout", `${username} timed out for ${duration} minutes`);
    res.json({ success: true, message: `${username} wurde für ${duration} Minuten ausgesetzt.` });
});

app.get("/stats", (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") return res.status(403).json({ success: false });
    const stats = Object.keys(users).reduce((acc, username) => {
        acc[username] = messages.filter(m => m.username === username).length;
        return acc;
    }, {});
    res.json({ success: true, stats });
});

app.post("/private-message", (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") return res.status(403).json({ success: false });
    const { username, content } = req.body;
    if (!users[username]) return res.json({ success: false, message: "Benutzer nicht gefunden!" });
    messages.push({ id: messages.length, username: "Admin", content: `[Privat an ${username}] ${content}`, timestamp: new Date().toISOString(), private: true });
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
    logAdminAction("private-message", `Sent to ${username}: ${content}`);
    res.json({ success: true, message: `Private Nachricht an ${username} gesendet.` });
});

app.post("/create-group", (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") return res.status(403).json({ success: false });
    const { groupName } = req.body;
    settings.groups = settings.groups || {};
    if (settings.groups[groupName]) return res.json({ success: false, message: "Gruppe existiert bereits!" });
    settings.groups[groupName] = [];
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    logAdminAction("create-group", `Group ${groupName} created`);
    res.json({ success: true, message: `Gruppe ${groupName} erstellt.` });
});

app.post("/assign-group", (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") return res.status(403).json({ success: false });
    const { username, groupName } = req.body;
    if (!users[username] || !settings.groups || !settings.groups[groupName]) return res.json({ success: false, message: "Ungültige Daten!" });
    users[username].group = groupName;
    settings.groups[groupName].push(username);
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    logAdminAction("assign-group", `${username} assigned to ${groupName}`);
    res.json({ success: true, message: `${username} wurde ${groupName} zugewiesen.` });
});

app.get("/search-messages", (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") return res.status(403).json({ success: false });
    const { query } = req.query;
    const results = messages.filter(m => m.content.toLowerCase().includes(query.toLowerCase()));
    res.json({ success: true, results });
});

app.post("/set-auto-mod", (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") return res.status(403).json({ success: false });
    const { maxMessages } = req.body;
    settings.autoMod.maxMessages = parseInt(maxMessages);
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    logAdminAction("set-auto-mod", `Max messages set to ${maxMessages}`);
    res.json({ success: true, message: `Auto-Mod: Max ${maxMessages} Nachrichten.` });
});

app.post("/add-tag", (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") return res.status(403).json({ success: false });
    const { username, tag } = req.body;
    if (!users[username]) return res.json({ success: false, message: "Benutzer nicht gefunden!" });
    users[username].tags = users[username].tags || [];
    users[username].tags.push(tag);
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    logAdminAction("add-tag", `${tag} added to ${username}`);
    res.json({ success: true, message: `${tag} zu ${username} hinzugefügt.` });
});

app.post("/lock-chat", (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") return res.status(403).json({ success: false });
    settings.chatLocked = true;
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    logAdminAction("lock-chat", "Chat locked");
    res.json({ success: true, message: "Chat gesperrt." });
});

app.post("/unlock-chat", (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") return res.status(403).json({ success: false });
    settings.chatLocked = false;
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    logAdminAction("unlock-chat", "Chat unlocked");
    res.json({ success: true, message: "Chat entsperrt." });
});

app.get("/export-messages", (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") return res.status(403).json({ success: false });
    res.json({ success: true, messages });
});

app.post("/import-users", (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") return res.status(403).json({ success: false });
    const { userList } = req.body;
    Object.assign(users, userList);
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    logAdminAction("import-users", `Imported ${Object.keys(userList).length} users`);
    res.json({ success: true, message: "Benutzer importiert." });
});

app.post("/censor-message", (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") return res.status(403).json({ success: false });
    const { messageId } = req.body;
    const message = messages.find(m => m.id === messageId);
    if (!message) return res.json({ success: false, message: "Nachricht nicht gefunden!" });
    message.censored = true;
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
    logAdminAction("censor-message", `Message ${messageId} censored`);
    res.json({ success: true, message: "Nachricht zensiert." });
});

app.post("/add-note", (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") return res.status(403).json({ success: false });
    const { username, note } = req.body;
    if (!users[username]) return res.json({ success: false, message: "Benutzer nicht gefunden!" });
    users[username].notes = users[username].notes || [];
    users[username].notes.push(note);
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    logAdminAction("add-note", `Note added to ${username}: ${note}`);
    res.json({ success: true, message: `Notiz für ${username} hinzugefügt.` });
});

app.post("/set-timer", (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") return res.status(403).json({ success: false });
    const { duration } = req.body;
    settings.timer = new Date(Date.now() + duration * 60000).toISOString();
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    logAdminAction("set-timer", `Timer set for ${duration} minutes`);
    res.json({ success: true, message: `Timer für ${duration} Minuten gesetzt.` });
});

app.post("/verify-user", (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") return res.status(403).json({ success: false });
    const { username } = req.body;
    if (!users[username]) return res.json({ success: false, message: "Benutzer nicht gefunden!" });
    users[username].verified = true;
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    logAdminAction("verify-user", `${username} verified`);
    res.json({ success: true, message: `${username} wurde verifiziert.` });
});

// Einfache Bot-Befehle als separate Routen für Buttons
app.post("/say-hello", (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") return res.status(403).json({ success: false });
    const message = { id: messages.length, username: "Bot", content: "Hallo zurück!", timestamp: new Date().toISOString() };
    messages.push(message);
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
    logAdminAction("say-hello", "Bot said hello");
    res.json({ success: true, message: "Hallo gesendet." });
});

app.post("/show-time", (req, res) => {
    if (!req.session.user || req.session.user.role !== "admin") return res.status(403).json({ success: false });
    const message = { id: messages.length, username: "Bot", content: `Aktuelle Zeit: ${new Date().toLocaleTimeString("de-DE")}`, timestamp: new Date().toISOString() };
    messages.push(message);
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
    logAdminAction("show-time", "Bot showed time");
    res.json({ success: true, message: "Zeit gesendet." });
});

const filterWords = (text) => {
    const badWords = ["idiot", "dumm"];
    return badWords.reduce((acc, word) => acc.replace(new RegExp(word, "gi"), "***"), text);
};

app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));