function login() {
    console.log("Login-Funktion aufgerufen");
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    if (!username || !password) {
        document.getElementById("message").textContent = "Bitte alle Felder ausfüllen!";
        return;
    }
    fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    })
    .then(res => {
        if (!res.ok) throw new Error(`HTTP-Fehler: ${res.status}`);
        return res.json();
    })
    .then(data => {
        console.log("Server-Antwort beim Login:", data);
        if (data.success) {
            localStorage.setItem("username", username);
            localStorage.setItem("role", data.role);
            window.location.href = "/chat";
        } else {
            document.getElementById("message").textContent = data.message;
        }
    })
    .catch(err => {
        console.error("Login-Fehler:", err);
        document.getElementById("message").textContent = "Fehler beim Login. Server nicht erreichbar?";
    });
}

function sendMessage() {
    const content = document.getElementById("message").value;
    if (!content) return;
    fetch("/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
    })
    .then(res => res.json())
    .then(data => {
        console.log("Antwort von send-message:", data);
        if (data.success) {
            loadMessages();
        } else {
            alert(data.message);
        }
    })
    .catch(err => console.error("Fehler beim Senden:", err));
    document.getElementById("message").value = "";
}

function loadMessages() {
    console.log("Lade Nachrichten..."); // Debugging
    fetch("/messages")
    .then(res => {
        if (!res.ok) throw new Error(`HTTP-Fehler: ${res.status}`);
        return res.json();
    })
    .then(data => {
        console.log("Geladene Nachrichten vom Server:", data); // Debugging
        if (!data.success) {
            console.error("Fehler beim Laden:", data.message);
            return;
        }
        const chatBox = document.getElementById("chat-box");
        const pinned = document.getElementById("pinned-message");
        console.log("Chat-Box vor dem Rendern:", chatBox.innerHTML); // Debugging
        chatBox.innerHTML = ""; // Chat-Box leeren
        if (data.pinnedMessage) {
            pinned.innerHTML = `<strong>Angepinnt:</strong> <span class="${data.pinnedMessage.username === "admin" ? "admin-name" : "user-name"}">${data.pinnedMessage.username}</span>: ${data.pinnedMessage.content}`;
        } else {
            pinned.innerHTML = "";
        }
        if (!data.messages || data.messages.length === 0) {
            console.log("Keine Nachrichten vorhanden"); // Debugging
            chatBox.innerHTML = "<p>Keine Nachrichten vorhanden.</p>";
        } else {
            console.log("Rendere Nachrichten:", data.messages); // Debugging
            data.messages.forEach(msg => {
                const className = msg.isAnnouncement ? "announcement" : (msg.username === "admin" ? "admin-name" : "user-name");
                chatBox.innerHTML += `<p><span class="${className}">${msg.username}</span>: ${msg.content} <small>(${msg.id})</small></p>`;
            });
        }
        console.log("Chat-Box nach dem Rendern:", chatBox.innerHTML); // Debugging
        chatBox.scrollTop = chatBox.scrollHeight;
    })
    .catch(err => console.error("Fehler beim Laden der Nachrichten:", err));
}

function loadUsersStatus() {
    fetch("/admin/users-status")
    .then(res => {
        if (!res.ok) throw new Error(`HTTP-Fehler: ${res.status}`);
        return res.json();
    })
    .then(data => {
        if (data.success) {
            const usersStatus = document.getElementById("users-status");
            usersStatus.innerHTML = "";
            data.users.forEach(user => {
                usersStatus.innerHTML += `<p>${user.username} - ${user.isOnline ? "Online" : "Offline"}</p>`;
            });
        } else {
            console.error("Fehler beim Laden der Nutzerliste:", data.message);
        }
    })
    .catch(err => console.error("Fehler beim Laden der Nutzerliste:", err));
}

function banUser() { const username = document.getElementById("manage-user").value; fetch("/ban", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username }) }).then(res => res.json()).then(data => { alert(data.message); loadUserList(); loadUsersStatus(); }); }
function unbanUser() { const username = document.getElementById("manage-user").value; fetch("/unban", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username }) }).then(res => res.json()).then(data => { alert(data.message); loadUserList(); loadUsersStatus(); }); }
function muteUser() { const username = document.getElementById("manage-user").value; fetch("/mute", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username }) }).then(res => res.json()).then(data => { alert(data.message); loadUserList(); loadUsersStatus(); }); }
function unmuteUser() { const username = document.getElementById("manage-user").value; fetch("/unmute", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username }) }).then(res => res.json()).then(data => { alert(data.message); loadUserList(); loadUsersStatus(); }); }
function tempBanUser() { const username = document.getElementById("manage-user").value; const duration = prompt("Dauer in Minuten:"); fetch("/temp-ban", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, duration }) }).then(res => res.json()).then(data => { alert(data.message); loadUserList(); loadUsersStatus(); }); }
function timeoutUser() { const username = document.getElementById("manage-user").value; const duration = prompt("Dauer in Minuten:"); fetch("/timeout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, duration }) }).then(res => res.json()).then(data => { alert(data.message); loadUserList(); loadUsersStatus(); }); }
function deleteUser() { const username = document.getElementById("manage-user").value; fetch("/delete-user", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username }) }).then(res => res.json()).then(data => { alert(data.message); loadUserList(); loadUsersStatus(); }); }
function renameUser() { const oldUsername = document.getElementById("manage-user").value; const newUsername = prompt("Neuer Benutzername:"); fetch("/rename-user", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ oldUsername, newUsername }) }).then(res => res.json()).then(data => { alert(data.message); loadUserList(); loadUsersStatus(); }); }
function changePassword() { const username = document.getElementById("manage-user").value; const newPassword = prompt("Neues Passwort:"); fetch("/change-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, newPassword }) }).then(res => res.json()).then(data => { alert(data.message); loadUserList(); loadUsersStatus(); }); }
function ipBanUser() { const username = document.getElementById("manage-user").value; fetch("/ip-ban", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username }) }).then(res => res.json()).then(data => { alert(data.message); loadUserList(); loadUsersStatus(); }); }
function addTag() { const username = document.getElementById("manage-user").value; const tag = prompt("Tag:"); fetch("/add-tag", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, tag }) }).then(res => res.json()).then(data => { alert(data.message); loadUserList(); loadUsersStatus(); }); }
function verifyUser() { const username = document.getElementById("manage-user").value; fetch("/verify-user", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username }) }).then(res => res.json()).then(data => { alert(data.message); loadUserList(); loadUsersStatus(); }); }

function addUser() {
    const username = document.getElementById("new-username").value;
    const password = document.getElementById("new-password").value;
    const role = document.getElementById("new-role").value;
    fetch("/add-user", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password, role }) }).then(res => res.json()).then(data => { alert(data.message); loadUserList(); loadUsersStatus(); });
}

function changeRole() {
    const username = document.getElementById("manage-user").value;
    const newRole = document.getElementById("change-role").value;
    fetch("/change-role", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, newRole }) }).then(res => res.json()).then(data => { alert(data.message); loadUserList(); loadUsersStatus(); });
}

function editMessage() {
    const messageId = document.getElementById("message-id").value;
    const newContent = document.getElementById("new-content").value;
    fetch("/edit-message", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messageId: parseInt(messageId), newContent }) }).then(res => res.json()).then(data => { alert(data.message); loadMessages(); });
}

function censorMessage() {
    const messageId = document.getElementById("message-id").value;
    fetch("/censor-message", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messageId: parseInt(messageId) }) }).then(res => res.json()).then(data => { alert(data.message); loadMessages(); });
}

function pinMessage() {
    const messageId = document.getElementById("message-id").value;
    fetch("/pin-message", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messageId: parseInt(messageId) }) }).then(res => res.json()).then(data => { alert(data.message); loadMessages(); });
}

function sendAnnouncement() {
    const content = document.getElementById("announcement").value;
    fetch("/announcement", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }) }).then(res => res.json()).then(data => { alert(data.message); loadMessages(); });
}

function sendPrivateMessage() {
    const username = document.getElementById("manage-user").value;
    const content = document.getElementById("private-message").value;
    fetch("/private-message", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, content }) }).then(res => res.json()).then(data => { alert(data.message); loadMessages(); });
}

function createGroup() {
    const groupName = document.getElementById("group-name").value;
    fetch("/create-group", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ groupName }) }).then(res => res.json()).then(data => { alert(data.message); loadUserList(); });
}

function assignGroup() {
    const username = document.getElementById("manage-user").value;
    const groupName = document.getElementById("group-name").value;
    fetch("/assign-group", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, groupName }) }).then(res => res.json()).then(data => { alert(data.message); loadUserList(); });
}

function clearChat() { fetch("/clear-chat", { method: "POST", headers: { "Content-Type": "application/json" } }).then(res => res.json()).then(data => { alert(data.message); loadMessages(); }); }
function lockChat() { fetch("/lock-chat", { method: "POST", headers: { "Content-Type": "application/json" } }).then(res => res.json()).then(data => { alert(data.message); }); }
function unlockChat() { fetch("/unlock-chat", { method: "POST", headers: { "Content-Type": "application/json" } }).then(res => res.json()).then(data => { alert(data.message); }); }
function exportMessages() { fetch("/export-messages").then(res => res.json()).then(data => { if (data.success) alert(JSON.stringify(data.messages, null, 2)); }); }

function changeTheme() {
    const theme = document.getElementById("theme").value;
    fetch("/change-theme", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ theme }) }).then(res => res.json()).then(data => { 
        alert(data.message); 
        document.body.className = theme;
    });
}

function setAutoMod() {
    const maxMessages = document.getElementById("max-messages").value;
    fetch("/set-auto-mod", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ maxMessages }) }).then(res => res.json()).then(data => { alert(data.message); });
}

function searchMessages() {
    const query = document.getElementById("search-query").value;
    fetch(`/search-messages?query=${query}`).then(res => res.json()).then(data => {
        if (data.success) alert(JSON.stringify(data.results, null, 2));
        else alert(data.message);
    });
}

function sendBotCommand() {
    const command = document.getElementById("bot-command").value;
    fetch("/bot-command", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ command }) }).then(res => res.json()).then(data => { alert(data.message); loadMessages(); });
}

function setTimer() {
    const duration = document.getElementById("timer-duration").value;
    fetch("/set-timer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ duration }) }).then(res => res.json()).then(data => { alert(data.message); });
}

function showUserInfo() {
    const username = document.getElementById("manage-user").value;
    fetch(`/user-info?username=${username}`).then(res => res.json()).then(data => {
        if (data.success) alert(JSON.stringify(data.info, null, 2));
        else alert(data.message);
    });
}

function showStats() {
    fetch("/stats").then(res => res.json()).then(data => {
        if (data.success) alert(JSON.stringify(data.stats, null, 2));
        else alert(data.message);
    });
}

function addNote() {
    const username = document.getElementById("manage-user").value;
    const note = prompt("Notiz:");
    fetch("/add-note", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, note }) }).then(res => res.json()).then(data => { alert(data.message); loadUserList(); });
}

function importUsers() {
    const userList = prompt("Benutzer als JSON eingeben:");
    fetch("/import-users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userList: JSON.parse(userList) }) }).then(res => res.json()).then(data => { alert(data.message); loadUserList(); loadUsersStatus(); });
}

function loadUserList() {
    fetch("/users")
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            const userList = document.getElementById("user-list");
            userList.innerHTML = "";
            for (const [username, info] of Object.entries(data.users)) {
                userList.innerHTML += `<p>${username} - Rolle: ${info.role}, Gebannt: ${info.banned || false}, Stumm: ${info.muted || false}, Gruppe: ${info.group || "N/A"}, Tags: ${info.tags?.join(", ") || "N/A"}</p>`;
            }
        }
    });
}

function loadAdminLogs() {
    fetch("/admin-logs")
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            const logs = document.getElementById("admin-logs");
            logs.innerHTML = "";
            data.logs.forEach(log => logs.innerHTML += `<p>${log.timestamp}: ${log.action} - ${log.details}</p>`);
        }
    });
}

window.onload = function() {
    const role = localStorage.getItem("role");
    if (!localStorage.getItem("username")) {
        console.log("Kein Benutzer im localStorage, redirect zu /"); // Debugging
        window.location.href = "/";
        return;
    }
    console.log("Seite geladen, Rolle:", role); // Debugging
    loadMessages();
    if (role === "admin") {
        document.getElementById("admin-panel").style.display = "block";
        loadUserList();
        loadAdminLogs();
        loadUsersStatus();
    }
    setInterval(() => {
        loadMessages();
        if (role === "admin") loadUsersStatus();
    }, 5000);
    document.body.className = "light";
};