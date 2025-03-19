const express = require("express");
const app = express();

app.use(express.static("public"));

app.get("/", (req, res) => {
    res.send("Login-Seite funktioniert!");
});

app.get("/chat", (req, res) => {
    res.send("Chat-Seite funktioniert!");
});

app.listen(3000, () => console.log("Server läuft auf Port 3000"));