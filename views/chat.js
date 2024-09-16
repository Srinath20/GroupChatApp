const socket = io(); // Connect to server

// Get the username from localStorage
const username = localStorage.getItem('username');

// Emit join event when the user joins
socket.emit('joinChat', username);

socket.on('message', (msg) => {
    const messageList = document.getElementById('messages');
    const newMessage = document.createElement('li');
    newMessage.textContent = msg;
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
