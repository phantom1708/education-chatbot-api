const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');

// Array untuk menyimpan riwayat percakapan (memori chatbot)
let conversationHistory = [];

function appendMessage(role, text) {
    const msg = document.createElement('div');
    // Menyesuaikan class CSS (user / bot)
    msg.classList.add('message', role === 'user' ? 'user' : 'bot');
    msg.textContent = text;
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const textUser = input.value.trim();
    if (!textUser) return;

    // 1. Tampilkan pesan user ke UI & masukkan ke history
    appendMessage('user', textUser);
    conversationHistory.push({ role: 'user', text: textUser });
    input.value = '';

    // 2. Buat elemen indikator loading sementara
    const loadingId = 'loading-' + Date.now();
    const loadingMsg = document.createElement('div');
    loadingMsg.id = loadingId;
    loadingMsg.classList.add('message', 'bot');
    loadingMsg.textContent = 'Gemini sedang berpikir...';
    chatBox.appendChild(loadingMsg);
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        // 3. Kirim data percakapan ke endpoint backend /api/chat
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conversation: conversationHistory })
        });

        const data = await response.json();
        
        // Hapus pesan loading
        document.getElementById(loadingId).remove();

        if (response.ok) {
            // Tampilkan hasil balasan dari model Gemini
            appendMessage('model', data.result);
            // Masukkan balasan model ke riwayat percakapan
            conversationHistory.push({ role: 'model', text: data.result });
        } else {
            appendMessage('bot', 'Error: ' + (data.error || 'Terjadi kesalahan pada server.'));
        }

    } catch (err) {
        document.getElementById(loadingId).remove();
        appendMessage('bot', 'Gagal terhubung ke server backend.');
        console.error(err);
    }
});