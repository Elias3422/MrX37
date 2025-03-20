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

function sayHello() {
    fetch("/say-hello", { method: "POST" })
    .then(res => res.json())
    .then(data => {
        if (data.success) loadMessages();
        else alert(data.message);
    });
}

function showTime() {
    fetch("/show-time", { method: "POST" })
    .then(res => res.json())
    .then(data => {
        if (data.success) loadMessages();
        else alert(data.message);
    });
}

function clearChat() {
    fetch("/clear-chat", { method: "POST" })
    .then(res => res.json())
    .then(data => {
        if (data.success) loadMessages();
        else alert(data.message);
    });
}

function lockChat() {
    fetch("/lock-chat", { method: "POST" })
    .then(res => res.json())
    .then(data => alert(data.message));
}

function unlockChat() {
    fetch("/unlock-chat", { method: "POST" })
    .then(res => res.json())
    .then(data => alert(data.message));
}

function banUser() {
    const username = document.getElementById("ban-user").value;
    fetch("/ban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username })
    })
    .then(res => res.json())
    .then(data => alert(data.message));
}

function unbanUser() {
    const username = document.getElementById("unban-user").value;
    fetch("/unban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username })
    })
    .then(res => res.json())
    .then(data => alert(data.message));
}

function muteUser() {
    const username = document.getElementById("mute-user").value;
    fetch("/mute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username })
    })
    .then(res => res.json())
    .then(data => alert(data.message));
}

function unmuteUser() {
    const username = document.getElementById("unmute-user").value;
    fetch("/unmute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username })
    })
    .then(res => res.json())
    .then(data => alert(data.message));
}

function addUser() {
    const username = document.getElementById("add-user-name").value;
    const password = document.getElementById("add-user-pass").value;
    fetch("/add-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role: "user" })
    })
    .then(res => res.json())
    .then(data => alert(data.message));
}

function deleteUser() {
    const username = document.getElementById("delete-user").value;
    fetch("/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username })
    })
    .then(res => res.json())
    .then(data => alert(data.message));
}

function editMessage() {
    const messageId = parseInt(document.getElementById("edit-msg-id").value);
    const newContent = document.getElementById("edit-msg-content").value;
    fetch("/edit-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, newContent })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) loadMessages();
        alert(data.message);
    });
}

function sendAnnouncement() {
    const content = document.getElementById("announcement").value;
    fetch("/announcement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) loadMessages();
        alert(data.message);
    });
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
    fetch("/check-role")
    .then(res => res.json())
    .then(data => {
        if (data.success && data.role === "admin") {
            document.getElementById("admin-panel").style.display = "block";
        }
    });
    loadMessages();
    setInterval(loadMessages, 5000); // Automatisch alle 5 Sekunden laden
};