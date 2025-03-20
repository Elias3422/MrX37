function sendMessage() {
    const content = document.getElementById("message").value;
    fetch("/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            document.getElementById("message").value = "";
            loadMessages();
        } else {
            alert(data.message);
        }
    })
    .catch(err => console.error("Fehler beim Senden:", err));
}

function sendBotCommand() {
    const command = document.getElementById("bot-command").value;
    fetch("/bot-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            document.getElementById("bot-command").value = "";
            loadMessages();
        } else {
            alert(data.message);
        }
    })
    .catch(err => console.error("Fehler beim Bot-Befehl:", err));
}

function loadMessages() {
    console.log("Lade Nachrichten...");
    fetch("/messages")
    .then(res => {
        if (res.status === 401 || res.status === 403) {
            console.log("Zugriff verweigert, redirect zu /");
            window.location.href = "/";
            return Promise.reject("Zugriff verweigert");
        }
        if (!res.ok) throw new Error(`HTTP-Fehler: ${res.status}`);
        return res.json();
    })
    .then(data => {
        console.log("Geladene Nachrichten:", data);
        const chatBox = document.getElementById("chat-box");
        const loading = document.getElementById("loading");
        chatBox.innerHTML = "";
        if (!data.messages || data.messages.length === 0) {
            chatBox.innerHTML = "<p>Keine Nachrichten vorhanden.</p>";
        } else {
            data.messages.forEach(msg => {
                const className = msg.username === "admin" ? "admin-name" : "user-name";
                chatBox.innerHTML += `<p><span class="${className}">${msg.username}</span>: ${msg.content} <small>(${msg.id})</small></p>`;
            });
        }
        chatBox.scrollTop = chatBox.scrollHeight;
        loading.style.display = "none";
        chatBox.style.display = "block";
    })
    .catch(err => console.error("Fehler beim Laden:", err));
}

window.onload = function() {
    const role = localStorage.getItem("role");
    console.log("Rolle aus localStorage:", role);
    if (role === "admin") {
        const adminPanel = document.getElementById("admin-panel");
        if (adminPanel) {
            adminPanel.style.display = "block";
        } else {
            console.error("Admin-Panel nicht gefunden!");
        }
    } else {
        console.log("Keine Admin-Rolle, Panel bleibt versteckt");
    }
    loadMessages();
    setInterval(loadMessages, 5000); // Automatisch alle 5 Sekunden laden
};