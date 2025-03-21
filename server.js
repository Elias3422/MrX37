function sendMessage() {
    const message = document.getElementById("message").value;
    fetch("/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            document.getElementById("message").value = "";
        } else {
            alert(data.message || "Fehler beim Senden!");
        }
    });
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
            chatBox.innerHTML = data.pinnedMessage ? `<p><b>Angepinnte Nachricht:</b> ${data.pinnedMessage.content} (ID: ${data.pinnedMessage.id})</p><hr>` : "";
            data.messages.forEach(msg => {
                const className = msg.username === "admin" ? "admin-name" : "user-name";
                const prefix = msg.recipients.length > 0 ? "[Privat] " : "";
                chatBox.innerHTML += `<p>${prefix}<span class="${className}">${msg.username}</span>: ${msg.content} <small>(${msg.id})</small></p>`;
            });
            chatBox.scrollTop = chatBox.scrollHeight;
        });
}

function checkSession() {
    fetch("/check-role")
        .then(res => {
            if (res.status === 401 || res.status === 403) {
                window.location.href = "/";
                return Promise.reject("Zugriff verweigert");
            }
            return res.json();
        })
        .then(data => {
            document.getElementById("admin-panel").style.display = data.role === "admin" ? "block" : "none";
        });
}

setInterval(() => {
    loadMessages();
    checkSession();
}, 5000);