const socket = io();
const username = localStorage.getItem('username');

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

document.getElementById('sendBtn').addEventListener('click', () => {
    const message = document.getElementById('chatInput').value;
    socket.emit('chatMessage', { username, message });
    document.getElementById('chatInput').value = '';
});
