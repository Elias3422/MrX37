// 🔔 Um Erlaubnis für Benachrichtigungen bitten
if (Notification.permission !== "granted") {
  Notification.requestPermission();
}

let lastMessageText = null;

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

function addUser() {
    const username = document.getElementById("add-user-name").value;
    const password = document.getElementById("add-user-password").value;
    const group = document.getElementById("add-user-group").value;

    fetch("/add-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, group })
    })
    .then(res => res.json())
    .then(data => alert(data.message));
}

// 🔁 Nachrichten regelmäßig laden + neue erkennen
function loadMessages() {
    fetch("/messages")
    .then(res => res.json())
    .then(data => {
        const messageList = document.getElementById("messages");
        messageList.innerHTML = "";

        if (data.success && data.messages) {
            data.messages.forEach(msg => {
                const li = document.createElement("li");
                li.textContent = msg.text;
                messageList.appendChild(li);
            });

            const latest = data.messages[data.messages.length - 1];
            if (latest && latest.text !== lastMessageText) {
                lastMessageText = latest.text;

                if (Notification.permission === "granted") {
                    new Notification("Neue Nachricht", {
                        body: latest.text,
                        icon: "/icon.png" // Optionales Icon
                    });
                }

                // 🔊 Optionaler Sound
                const audio = new Audio('/notification.mp3');
                audio.play();
            }
        }
    });
}

function loadUserList() {
    fetch("/users")
    .then(res => res.json())
    .then(data => {
        const userList = document.getElementById("user-list");
        if (data.success && data.users && data.users.list) {
            userList.innerHTML = "";
            data.users.list.forEach(user => {
                const li = document.createElement("li");
                li.textContent = user;
                userList.appendChild(li);
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

// 🚀 Initialisierung beim Laden der Seite
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
    }, 5000); // Alle 5 Sekunden aktualisieren
};
