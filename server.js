const express = require("express");
const app = express();

// Einfache Routen ohne Abhängigkeiten außer Express
app.get("/", (req, res) => {
    res.send("Login-Seite läuft!");
});

app.get("/chat", (req, res) => {
    res.send("Chat-Seite läuft!");
});

// Glitch erwartet oft process.env.PORT
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server läuft auf Port ${port}`);
});