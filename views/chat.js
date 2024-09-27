const socket = io(); // Connect to the server

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
        console.log('Fetched messages:', messages); // Debugging

        const messageList = document.getElementById('messages');
        messageList.innerHTML = ''; // Clear existing messages

        // Sort messages by createdAt
        messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        messages.forEach(msg => {
            appendMessage(msg.User.name, msg.message);
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
    }
}

// Function to append a message to the chat
function appendMessage(username, message) {
    const messageList = document.getElementById('messages');
    const newMessage = document.createElement('li');
    newMessage.textContent = `${username}: ${message}`;
    messageList.appendChild(newMessage);
}

// Call fetchMessages when the page loads
document.addEventListener('DOMContentLoaded', () => {
    fetchMessages();
    socket.emit('joinChat', username); // Emit join event after fetching messages
});

// Handle receiving a new message
socket.on('newMessage', (msg) => {
    appendMessage(msg.User.name, msg.message);
});

// Handle when a user joins the chat
socket.on('userJoined', (msg) => {
    appendMessage('System', msg);
});

// Handle sending a message
document.getElementById('sendBtn').addEventListener('click', () => {
    const message = document.getElementById('chatInput').value;
    if (message.trim()) { // Check if the message is not empty
        socket.emit('chatMessage', { username, message }); // Send username with message
        document.getElementById('chatInput').value = ''; // Clear input after sending
    }
});