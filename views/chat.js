const socket = io(); // Connect to server

// Get the username from localStorage
const username = localStorage.getItem('username');

// Fetch and display all messages
async function fetchMessages() {
    try {
        const response = await fetch('/chat/messages');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const messages = await response.json();
        console.log('Fetched messages:', messages); // Add this line for debugging

        const messageList = document.getElementById('messages');
        messageList.innerHTML = ''; // Clear existing messages

        messages.forEach(msg => {
            const newMessage = document.createElement('li');
            newMessage.textContent = `${msg.User.name}: ${msg.message}`;
            messageList.appendChild(newMessage);
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
    }
}

// Call fetchMessages when the page loads
document.addEventListener('DOMContentLoaded', () => {
    fetchMessages();
    socket.emit('joinChat', username); // Emit join event after fetching messages
});

// Handle receiving a new message
socket.on('newMessage', (msg) => {
    const messageList = document.getElementById('messages');
    const newMessage = document.createElement('li');
    newMessage.textContent = `${msg.User.name}: ${msg.message}`;
    messageList.appendChild(newMessage);
});

// Handle receiving a new message
socket.on('newMessage', (msg) => {
    const messageList = document.getElementById('messages');
    const newMessage = document.createElement('li');
    newMessage.textContent = `${msg.User.name}: ${msg.message}`;
    messageList.appendChild(newMessage);
});

socket.on('userJoined', (msg) => {
    const messageList = document.getElementById('messages');
    const newMessage = document.createElement('li');
    newMessage.textContent = msg;
    messageList.appendChild(newMessage);
});

// Handle sending a message
document.getElementById('sendBtn').addEventListener('click', () => {
    const message = document.getElementById('chatInput').value;
    socket.emit('chatMessage', { username, message }); // Send username with message
    document.getElementById('chatInput').value = '';
});