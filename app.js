const express = require('express');
const path = require('path');
const sequelize = require('./util/db');
const userRoutes = require('./routes/userRoutes');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http'); // Add this to create a server
const { Server } = require('socket.io'); // Import socket.io

dotenv.config();

const app = express();
const server = http.createServer(app); // Create a server using http
const io = new Server(server); // Initialize socket.io with the server

const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'views')));

// Define routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'signup.html'));
});
app.use('/user', userRoutes);

// Initialize WebSocket connections
io.on('connection', (socket) => {
    console.log('A user connected');

    // Handle user joining chat
    socket.on('joinChat', (username) => {
        socket.username = username; // Store the username on the socket
        io.emit('userJoined', `${username} joined the chat`); // Broadcast that the user joined
    });

    // Handle chat messages
    socket.on('chatMessage', ({ username, message }) => {
        io.emit('message', `${username}: ${message}`); // Broadcast the message with the username
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});


// Sync the database and start the server
sequelize.sync()
    .then(() => {
        server.listen(PORT, () => { // app.listen() method works fine for a typical Express app, but since we need to add WebSocket functionality (via Socket.IO), we use the http module to create the server instance.
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('Error syncing database:', err);
    });
