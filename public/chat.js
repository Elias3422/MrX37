// Öffentliche Nachricht senden
function sendMessage() {
    const content = document.getElementById("message").value.trim();
    if (!content) return alert("Bitte eine Nachricht eingeben");
    fetch("/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
    })
    .then(res => {
        if (!res.ok) throw new Error(`Server-Fehler: ${res.status}`);
        return res.json();
    })
    .then(data => {
        if (data.success) {
            document.getElementById("message").value = "";
            loadMessages();
        } else {
            alert("Fehler vom Server: " + (data.message || "Unbekannter Fehler"));
        }
    })
    .catch(err => alert("Fehler beim Senden: " + err.message));
}

// Private Nachricht senden (für alle Benutzer)
function sendPrivateMessageUser() {
    const recipient = document.getElementById("private-msg-recipient").value.trim();
    const content = document.getElementById("private-msg-content-user").value.trim();
    if (!recipient || !content) return alert("Bitte Empfänger und Nachricht eingeben");
    fetch("/private-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: recipient, content, isPrivate: true })
    })
    .then(res => {
        if (!res.ok) throw new Error(`Server-Fehler: ${res.status}`);
        return res.json();
    })
    .then(data => {
        if (data.success) {
            document.getElementById("private-msg-content-user").value = "";
            loadMessages();
        } else {
            alert("Fehler vom Server: " + (data.message || "Unbekannter Fehler"));
        }
    })
    .catch(err => alert("Fehler beim Senden der privaten Nachricht: " + err.message));
}

// Private Nachricht senden (Admin-Panel)
function sendPrivateMessage() {
    const username = document.getElementById("private-msg-user").value.trim();
    const content = document.getElementById("private-msg-content").value.trim();
    if (!username || !content) return alert("Bitte Empfänger und Nachricht eingeben");
    fetch("/private-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, content, isPrivate: true })
    })
    .then(res => {
        if (!res.ok) throw new Error(`Server-Fehler: ${res.status}`);
        return res.json();
    })
    .then(data => {
        if (data.success) loadMessages();
        alert(data.message);
    })
    .catch(err => alert("Fehler beim Senden der privaten Nachricht: " + err.message));
}

// Admin-Funktionen
function sayHello() {
    fetch("/say-hello", { method: "POST" })
    .then(res => {
        if (!res.ok) throw new Error(`Server-Fehler: ${res.status}`);
        return res.json();
    })
    .then(data => {
        if (data.success) loadMessages();
        else alert("Fehler vom Server: " + data.message);
    })
    .catch(err => alert("Fehler bei 'Hallo sagen': " + err.message));
}

function showTime() {
    fetch("/show-time", { method: "POST" })
    .then(res => {
        if (!res.ok) throw new Error(`Server-Fehler: ${res.status}`);
        return res.json();
    })
    .then(data => {
        if (data.success) loadMessages();
        else alert("Fehler vom Server: " + data.message);
    })
    .catch(err => alert("Fehler bei 'Zeit anzeigen': " + err.message));
}

function clearChat() {
    fetch("/clear-chat", { method: "POST" })
    .then(res => {
        if (!res.ok) throw new Error(`Server-Fehler: ${res.status}`);
        return res.json();
    })
    .then(data => {
        if (data.success) loadMessages();
        else alert("Fehler vom Server: " + data.message);
    })
    .catch(err => alert("Fehler beim Chat leeren: " + err.message));
}

function lockChat() {
    fetch("/lock-chat", { method: "POST" })
    .then(res => {
        if (!res.ok) throw new Error(`Server-Fehler: ${res.status}`);
        return res.json();
    })
    .then(data => alert(data.message))
    .catch(err => alert("Fehler beim Sperren des Chats: " + err.message));
}

function unlockChat() {
    fetch("/unlock-chat", { method: "POST" })
    .then(res => {
        if (!res.ok) throw new Error(`Server-Fehler: ${res.status}`);
        return res.json();
    })
    .then(data => alert(data.message))
    .catch(err => alert("Fehler beim Entsperren des Chats: " + err.message));
}

function addUser() {
    const username = document.getElementById("add-user-name").value.trim();
    const password = document.getElementById("add-user-pass").value.trim();
    const role = document.getElementById("add-user-role").value;
    const group = document.getElementById("add-user-group").value;
    if (!username || !password) return alert("Benutzername und Passwort erforderlich");
    fetch("/add-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role, group })
    })
    .then(res => {
        if (!res.ok) throw new Error(`Server-Fehler: ${res.status}`);
        return res.json();
    })
    .then(data => {
        alert(data.message);
        loadUserList();
    })
    .catch(err => alert("Fehler beim Hinzufügen des Benutzers: " + err.message));
}

function deleteUser() {
    const username = document.getElementById("delete-user").value.trim();
    if (!username) return alert("Benutzername erforderlich");
    fetch("/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username })
    })
    .then(res => {
        if (!res.ok) throw new Error(`Server-Fehler: ${res.status}`);
        return res.json();
    })
    .then(data => {
        alert(data.message);
        loadUserList();
    })
    .catch(err => alert("Fehler beim Löschen des Benutzers: " + err.message));
}

function banUser() {
    const username = document.getElementById("ban-user").value.trim();
    if (!username) return alert("Benutzername erforderlich");
    fetch("/ban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username })
    })
    .then(res => {
        if (!res.ok) throw new Error(`Server-Fehler: ${res.status}`);
        return res.json();
    })
    .then(data => {
        alert(data.message);
        loadUserList();
    })
    .catch(err => alert("Fehler beim Bannen des Benutzers: " + err.message));
}

function unbanUser() {
    const username = document.getElementById("unban-user").value.trim();
    if (!username) return alert("Benutzername erforderlich");
    fetch("/unban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username })
    })
    .then(res => {
        if (!res.ok) throw new Error(`Server-Fehler: ${res.status}`);
        return res.json();
    })
    .then(data => {
        if (data.success) {
            alert(data.message);
            loadUserList();
        } else {
            alert("Fehler vom Server: " + (data.message || "Unbekannter Fehler"));
        }
    })
    .catch(err => alert("Fehler beim Entbannen des Benutzers: " + err.message));
}

// Nachrichten laden und anzeigen
function loadMessages() {
    fetch("/messages")
    .then(res => {
        if (res.status === 401 || res.status === 403) {
            window.location.href = "/";
            return Promise.reject("Zugriff verweigert");
        }
        if (!res.ok) throw new Error(`Server-Fehler: ${res.status}`);
        return res.json();
    })
    .then(data => {
        const chatBox = document.getElementById("chat-box");
        const loading = document.getElementById("loading");
        const currentUser = data.currentUser || "guest";

        console.log("Server-Antwort von /messages:", data);

        chatBox.innerHTML = data.pinnedMessage ? `<p><b>Angepinnte Nachricht:</b> ${data.pinnedMessage.content} (ID: ${data.pinnedMessage.id})</p><hr>` : "";
        if (!data.messages || data.messages.length === 0) {
            chatBox.innerHTML += "<p>Keine Nachrichten vorhanden.</p>";
        } else {
            data.messages.forEach(msg => {
                if (msg.isPrivate && msg.username !== currentUser && msg.recipient !== currentUser) return;
                const className = msg.username === "admin" ? "admin-name" : "user-name";
                const privateLabel = msg.isPrivate ? "[Privat] " : "";
                chatBox.innerHTML += `<p><span class="${className}">${msg.username}</span>: ${privateLabel}${msg.content} <small>(${msg.id})</small></p>`;
            });
        }

        chatBox.scrollTop = chatBox.scrollHeight;
        loading.style.display = "none";
        chatBox.style.display = "block";
    })
    .catch(err => {
        const chatBox = document.getElementById("chat-box");
        const loading = document.getElementById("loading");
        chatBox.innerHTML = "<p>Fehler beim Laden der Nachrichten: " + err.message + "</p>";
        loading.style.display = "none";
        chatBox.style.display = "block";
        console.error("Fehler beim Laden:", err);
    });
}

// Benutzerliste laden
function loadUserList() {
    fetch("/admin/users-status")
    .then(res => res.status === 403 ? Promise.resolve({ success: false }) : res.json())
    .then(data => {
        const userList = document.getElementById("user-list-content");
        userList.innerHTML = "";
        if (data.success && data.users) {
            data.users.forEach(user => {
                const statusClass = user.isOnline ? "online" : "offline";
                const tags = user.tags.length ? ` [${user.tags.join(", ")}]` : "";
                const verified = user.verified ? " ✅" : "";
                userList.innerHTML += `<li>${user.username}${tags}${verified} <span class="status-dot ${statusClass}"></span></li>`;
            });
        } else {
            userList.innerHTML = "<li>Keine Benutzer verfügbar oder keine Admin-Rechte.</li>";
        }
    })
    .catch(err => {
        const userList = document.getElementById("user-list-content");
        userList.innerHTML = "<li>Fehler beim Laden der Benutzerliste: " + err.message + "</li>";
    });
}

// Gruppen-Dropdowns aktualisieren
function updateGroupDropdowns() {
    fetch("/users")
    .then(res => res.json())
    .then(data => {
        const groupSelects = [document.getElementById("add-user-group"), document.getElementById("assign-group")];
        groupSelects.forEach(select => {
            select.innerHTML = "<option value=''>Keine</option>";
            if (data.success && data.users.groups) {
                Object.keys(data.users.groups).forEach(group => {
                    const option = document.createElement("option");
                    option.value = group;
                    option.text = group;
                    select.appendChild(option);
                });
            }
        });
    })
    .catch(err => console.error("Fehler beim Aktualisieren der Gruppen:", err));
}

// Initialisierung
window.onload = function() {
    fetch("/check-role")
    .then(res => {
        if (!res.ok) throw new Error(`Server-Fehler: ${res.status}`);
        return res.json();
    })
    .then(data => {
        if (data.success && data.role === "admin") {
            document.getElementById("admin-panel").style.display = "block";
            document.querySelectorAll(".admin-section h4").forEach(header => {
                header.addEventListener("click", () => {
                    const section = header.parentElement;
                    section.classList.toggle("collapsed");
                });
            });
            updateGroupDropdowns();
            loadUserList();
        }
    })
    .catch(err => console.error("Fehler beim Überprüfen der Rolle:", err));

    loadMessages();
    setInterval(() => {
        loadMessages();
        loadUserList();
    }, 5000);
};