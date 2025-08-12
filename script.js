document.getElementById('sendBtn').addEventListener('click', sendMessage);
document.getElementById('userInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') sendMessage();
});

function addMessageToUI(text, sender) {
    const chatMessages = document.getElementById('chatMessages');
    const msg = document.createElement('div');
    msg.classList.add('message', sender);
    msg.textContent = text;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function sendMessage() {
    const input = document.getElementById('userInput');
    const userMessage = input.value.trim();
    if (!userMessage) return;

    addMessageToUI(userMessage, 'user');
    input.value = '';

    // API 호출 (예: OpenAI, Flask 서버, etc.)
    try {
        const res = await fetch('https://your-api-endpoint.com/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: userMessage })
        });

        const data = await res.json();
        addMessageToUI(data.reply || '응답이 없습니다.', 'bot');
    } catch (error) {
        addMessageToUI('오류 발생: ' + error.message, 'bot');
    }
}
