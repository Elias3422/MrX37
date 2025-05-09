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
    });
}

function sayHello() {
    fetch("/say-hello", { method: "POST" }).then(res => res.json()).then(data => { if (data.success) loadMessages(); else alert(data.message); });
}

function showTime() {
    fetch("/show-time", { method: "POST" }).then(res => res.json()).then(data => { if (data.success) loadMessages(); else alert(data.message); });
}

function clearChat() {
    fetch("/clear-chat", { method: "POST" }).then(res => res.json()).then(data => { if (data.success) loadMessages(); else alert(data.message); });
}

function lockChat() {
    fetch("/lock-chat", { method: "POST" }).then(res => res.json()).then(data => alert(data.message));
}

function unlockChat() {
    fetch("/unlock-chat", { method: "POST" }).then(res => res.json()).then(data => alert(data.message));
}

function addUser() {
    const username = document.getElementById("add-user-name").value;
    const password = document.getElementById("add-user-pass").value;
    const role = document.getElementById("add-user-role").value;
    const group = document.getElementById("add-user-group").value;
    fetch("/add-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role, group })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message);
        loadUserList();
    });
}

function deleteUser() {
    const username = document.getElementById("delete-user").value;
    fetch("/delete-user", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username }) })
    .then(res => res.json())
    .then(data => { alert(data.message); loadUserList(); });
}

function banUser() {
    const username = document.getElementById("ban-user").value;
    fetch("/ban", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username }) })
    .then(res => res.json())
    .then(data => { alert(data.message); loadUserList(); });
}

function unbanUser() {
    const username = document.getElementById("unban-user").value;
    fetch("/unban", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username }) })
    .then(res => res.json())
    .then(data => { alert(data.message); loadUserList(); });
}

function muteUser() {
    const username = document.getElementById("mute-user").value;
    fetch("/mute", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username }) })
    .then(res => res.json())
    .then(data => { alert(data.message); loadUserList(); });
}

function unmuteUser() {
    const username = document.getElementById("unmute-user").value;
    fetch("/unmute", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username }) })
    .then(res => res.json())
    .then(data => { alert(data.message); loadUserList(); });
}

function editMessage() {
    const messageId = parseInt(document.getElementById("edit-msg-id").value);
    const newContent = document.getElementById("edit-msg-content").value;
    fetch("/edit-message", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messageId, newContent }) })
    .then(res => res.json())
    .then(data => { if (data.success) loadMessages(); alert(data.message); });
}

function sendAnnouncement() {
    const content = document.getElementById("announcement").value;
    fetch("/announcement", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }) })
    .then(res => res.json())
    .then(data => { if (data.success) loadMessages(); alert(data.message); });
}

function censorMessage() {
    const messageId = parseInt(document.getElementById("censor-msg-id").value);
    fetch("/censor-message", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messageId }) })
    .then(res => res.json())
    .then(data => { if (data.success) loadMessages(); alert(data.message); });
}

function changeTheme() {
    const theme = document.getElementById("theme").value;
    fetch("/change-theme", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ theme }) })
    .then(res => res.json())
    .then(data => { alert(data.message); loadMessages(); });
}

function pinMessage() {
    const messageId = parseInt(document.getElementById("pin-msg-id").value);
    fetch("/pin-message", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messageId }) })
    .then(res => res.json())
    .then(data => { if (data.success) loadMessages(); alert(data.message); });
}

function setAutoMod() {
    const maxMessages = document.getElementById("auto-mod-max").value;
    fetch("/set-auto-mod", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ maxMessages }) })
    .then(res => res.json())
    .then(data => alert(data.message));
}

function createGroup() {
    const groupName = document.getElementById("group-name").value;
    fetch("/create-group", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ groupName }) })
    .then(res => res.json())
    .then(data => { alert(data.message); updateGroupDropdowns(); });
}

function assignGroup() {
    const username = document.getElementById("assign-user").value;
    const groupName = document.getElementById("assign-group").value;
    fetch("/assign-group", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, groupName }) })
    .then(res => res.json())
    .then(data => { alert(data.message); loadUserList(); });
}

function setTimer() {
    const duration = document.getElementById("timer-duration").value;
    fetch("/set-timer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ duration }) })
    .then(res => res.json())
    .then(data => alert(data.message));
}

function exportMessages() {
    fetch("/export-messages", { method: "POST" })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            const blob = new Blob([JSON.stringify(data.messages, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "chat-messages.json";
            a.click();
            URL.revokeObjectURL(url);
        } else {
            alert(data.message);
        }
    });
}

function importMessages() {
    const fileInput = document.getElementById("import-messages");
    const file = fileInput.files[0];
    if (!file) return alert("Bitte eine Datei auswählen!");
    const reader = new FileReader();
    reader.onload = function(e) {
        const messageList = JSON.parse(e.target.result);
        fetch("/import-messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messageList }) })
        .then(res => res.json())
        .then(data => { if (data.success) loadMessages(); alert(data.message); });
    };
    reader.readAsText(file);
}

function changeRole() {
    const username = document.getElementById("change-role-user").value;
    const newRole = document.getElementById("change-role").value;
    fetch("/change-role", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, newRole }) })
    .then(res => res.json())
    .then(data => { alert(data.message); loadUserList(); });
}

function changePassword() {
    const username = document.getElementById("change-pass-user").value;
    const newPassword = document.getElementById("change-pass").value;
    fetch("/change-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, newPassword }) })
    .then(res => res.json())
    .then(data => { alert(data.message); loadUserList(); });
}

function ipBanUser() {
    const username = document.getElementById("ip-ban-user").value;
    fetch("/ip-ban", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username }) })
    .then(res => res.json())
    .then(data => { alert(data.message); loadUserList(); });
}

function tempBanUser() {
    const username = document.getElementById("temp-ban-user").value;
    const duration = document.getElementById("temp-ban-duration").value;
    fetch("/temp-ban", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, duration }) })
    .then(res => res.json())
    .then(data => { alert(data.message); loadUserList(); });
}

function showStats() {
    fetch("/stats")
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            const stats = Object.entries(data.stats).map(([user, count]) => `${user}: ${count} Nachrichten`).join("\n");
            alert("Chat-Statistiken:\n" + stats);
        } else {
            alert(data.message);
        }
    });
}

function sendPrivateMessage() {
    const username = document.getElementById("private-msg-user").value;
    const content = document.getElementById("private-msg-content").value;
    fetch("/private-message", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, content }) })
    .then(res => res.json())
    .then(data => { if (data.success) loadMessages(); alert(data.message); });
}

function addTag() {
    const username = document.getElementById("tag-user").value;
    const tag = document.getElementById("tag-content").value;
    fetch("/add-tag", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, tag }) })
    .then(res => res.json())
    .then(data => { alert(data.message); loadUserList(); });
}

function addNote() {
    const username = document.getElementById("note-user").value;
    const note = document.getElementById("note-content").value;
    fetch("/add-note", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, note }) })
    .then(res => res.json())
    .then(data => { alert(data.message); loadUserList(); });
}

function verifyUser() {
    const username = document.getElementById("verify-user").value;
    fetch("/verify-user", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username }) })
    .then(res => res.json())
    .then(data => { alert(data.message); loadUserList(); });
}

function loadMessages() {
    fetch("/messages")
    .then(res => {
        if (res.status === 401 || res.status === 403) {
            window.location.href = "/";
            return Promise.reject("Zugriff verweigert");
        }
        return res.json();
    })
    .then(data => {
        const chatBox = document.getElementById("chat-box");
        const loading = document.getElementById("loading");
        chatBox.innerHTML = data.pinnedMessage ? `<p><b>Angepinnte Nachricht:</b> ${data.pinnedMessage.content} (ID: ${data.pinnedMessage.id})</p><hr>` : "";
        if (!data.messages || data.messages.length === 0) {
            chatBox.innerHTML += "<p>Keine Nachrichten vorhanden.</p>";
        } else {
            data.messages.forEach(msg => {
                const className = msg.username === "admin" ? "admin-name" : "user-name";
                chatBox.innerHTML += `<p><span class="${className}">${msg.username}</span>: ${msg.content} <small>(${msg.id})</small></p>`;
            });
        }
        chatBox.scrollTop = chatBox.scrollHeight;
        loading.style.display = "none";
        chatBox.style.display = "block";
        document.body.classList.toggle("dark-mode", data.theme === "dark");
    });
}

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
    });
}

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
    });
}

window.onload = function() {
    fetch("/check-role")
    .then(res => res.json())
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
        }
    });
    loadMessages();
    loadUserList();
    setInterval(() => {
        loadMessages();
        loadUserList();
    }, 5000);
};