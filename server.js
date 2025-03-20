const express = require("express");
const session = require("express-session");
const fs = require("fs");
const path = require("path");
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(session({
    secret: "super-secret-key",
    resave: false,
    saveUninitialized: false
}));

// Datei-Handling
const USERS_FILE = path.join(__dirname, "users.json");
const MESSAGES_FILE = path.join(__dirname, "messages.json");

const initializeFile = (filePath, defaultContent) => {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(defaultContent, null, 2));
    }
    return JSON.parse(fs.readFileSync(filePath));
};

let users = initializeFile(USERS_FILE, { "admin": { password: "admin123", role: "admin" } });
let messages = initializeFile(MESSAGES_FILE, []);

// Routen
app.get("/", (req, res) => {
    console.log("Zugriff auf /");
    res.sendFile(path.join(__dirname, "public/index.html"));
});

app.post("/login", (req, res) => {
    const { username, password } = req.body;
    console.log("Login-Anfrage:", { username, password });
    const user = users[username];
    if (user && user.password === password) {
        req.session.user = { username, role: user.role };
        console.log("Session gesetzt:", req.session.user);
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
        return res.json({ success: true, role: user.role });
    }
    console.log("Login fehlgeschlagen für:", username);
    res.json({ success: false, message: "Falsche Anmeldedaten!" });
});

app.get("/chat", (req, res) => {
    console.log("Zugriff auf /chat, Session:", req.session.user);
    if (!req.session.user) {
        console.log("Keine Session, redirect zu /");
        return res.redirect("/");
    }
    res.sendFile(path.join(__dirname, "public/chat.html"));
});

app.get("/messages", (req, res) => {
    console.log("Zugriff auf /messages, Session:", req.session.user);
    if (!req.session.user) {
        console.log("Keine Session bei /messages");
        return res.status(401).json({ success: false, message: "Nicht eingeloggt!" });
    }
    console.log("Nachrichten gesendet:", messages);
    res.json({ success: true, messages });
});

app.post("/send-message", (req, res) => {
    console.log("Zugriff auf /send-message, Session:", req.session.user);
    if (!req.session.user) {
        console.log("Keine Session bei /send-message");
        return res.status(401).json({ success: false, message: "Nicht eingeloggt!" });
    }
    const { content } = req.body;
    if (!content) {
        return res.status(400).json({ success: false, message: "Nachricht leer!" });
    }
    const message = {
        id: messages.length,
        username: req.session.user.username,
        content,
        timestamp: new Date().toISOString()
    };
    messages.push(message);
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
    console.log("Nachricht hinzugefügt:", message);
    res.json({ success: true });
});

// Admin-Route: Bot-Befehle (alle vorherigen Funktionen)
app.post("/bot-command", (req, res) => {
    console.log("Zugriff auf /bot-command, Session:", req.session.user);
    if (!req.session.user || req.session.user.role !== "admin") {
        console.log("Keine Admin-Rechte");
        return res.status(403).json({ success: false, message: "Nur für Admins!" });
    }
    const { command } = req.body;
    if (!command) {
        return res.status(400).json({ success: false, message: "Befehl leer!" });
    }
    let response;
    switch (command.toLowerCase()) {
        case "hello":
            response = "Hallo zurück!";
            break;
        case "time":
            response = `Aktuelle Zeit: ${new Date().toLocaleTimeString("de-DE")}`;
            break;
        case "clear":
            messages = [];
            fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
            response = "Chat geleert!";
            break;
        case "users":
            response = `Registrierte Benutzer: ${Object.keys(users).join(", ")}`;
            break;
        default:
            response = "Unbekannter Befehl. Verfügbar: hello, time, clear, users";
    }
    const message = {
        id: messages.length,
        username: "Bot",
        content: response,
        timestamp: New Date().toISOString()
    };
    messages.push(message);
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
    console.log("Bot-Nachricht hinzugefügt:", message);
    res.json({ success: true });
});

// Server starten
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server läuft auf Port ${port}`);
});