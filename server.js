const express = require("express");
const session = require("express-session");
const fs = require("fs");
const app = express();
const path = require("path");
const bodyParser = require("body-parser");
const settings = require("./settings.json"); // Angenommene Einstellungsdatei

const MESSAGES_FILE = path.join(__dirname, "messages.json");
const users = {}; // Angenommene Benutzerverwaltung

// Middleware für Body Parsing
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Simulierte Daten für Nachrichten
let messages = JSON.parse(fs.readFileSync(MESSAGES_FILE, "utf-8") || "[]");

const filterWords = (content) => {
    // Hier kannst du eine Zensur- oder Filterlogik einbauen
    return content; // Für Demo: Keine Filterung
};

const updateLastActivity = (username) => {
    // Update der letzten Aktivität des Benutzers
    users[username].lastActivity = new Date().toISOString();
};

// Nachrichten senden (auch private)
app.post("/send-private-message", (req, res) => {
    if (!req.session.user || users[req.session.user.username].muted || settings.chatLocked) {
        return res.status(403).json({ success: false, message: "Keine Berechtigung!" });
    }

    const { content, recipient } = req.body;

    // Überprüfe, ob der Empfänger existiert
    if (!users[recipient]) {
        return res.status(400).json({ success: false, message: "Empfänger existiert nicht!" });
    }

    // Nachrichtenbegrenzung
    const userMessages = messages.filter(m => m.username === req.session.user.username).length;
    const maxMessages = settings.autoMod.maxMessages || 10;
    if (userMessages >= maxMessages) return res.json({ success: false, message: "Nachrichtenlimit erreicht!" });

    const filteredContent = filterWords(content);

    const message = {
        id: messages.length,
        username: req.session.user.username,
        content: filteredContent,
        recipient, // Empfänger hinzugefügt
        timestamp: new Date().toISOString()
    };

    messages.push(message);
    updateLastActivity(req.session.user.username);
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
    res.json({ success: true });
});

// Nachrichten abrufen (nur eigene oder private Nachrichten)
app.get("/messages", (req, res) => {
    if (!req.session.user) return res.status(401).json({ success: false, message: "Nicht eingeloggt!" });

    // Filtere die Nachrichten, sodass nur eigene oder private Nachrichten angezeigt werden
    const userMessages = messages.filter(m => m.username === req.session.user.username || m.recipient === req.session.user.username);

    res.json({
        success: true,
        messages: userMessages.filter(m => !m.censored),  // Nur nicht zensierte Nachrichten
        pinnedMessage: settings.pinnedMessage,
        theme: settings.theme
    });
});

// Registrierung eines neuen Benutzers
app.post("/register", (req, res) => {
    const { username, password } = req.body;
    
    // Überprüfe, ob der Benutzer bereits existiert
    if (users[username]) {
        return res.status(400).json({ success: false, message: "Benutzername bereits vergeben!" });
    }

    // Benutzer hinzufügen
    users[username] = { username, password, muted: false, lastActivity: new Date().toISOString() };
    res.json({ success: true, message: "Benutzer registriert!" });
});

// Benutzeranmeldung
app.post("/login", (req, res) => {
    const { username, password } = req.body;

    // Überprüfe, ob Benutzer existiert und Passwort korrekt ist
    if (!users[username] || users[username].password !== password) {
        return res.status(401).json({ success: false, message: "Ungültige Anmeldedaten!" });
    }

    // Sitzung setzen
    req.session.user = users[username];
    res.json({ success: true, message: "Erfolgreich eingeloggt!" });
});

// Benutzer abmelden
app.post("/logout", (req, res) => {
    req.session.destroy();
    res.json({ success: true, message: "Erfolgreich abgemeldet!" });
});

// Server starten
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});
