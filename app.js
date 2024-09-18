const express = require('express');
const path = require('path');
const sequelize = require('./util/db');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

app.use(express.static(path.join(__dirname, 'views')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'signup.html'));
});
app.use('/user', userRoutes);
app.use('/chat', chatRoutes);
//Intialize connection
io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('joinChat', (username) => {
        socket.username = username;
        io.emit('userJoined', `${username} joined the chat`);
    });

    socket.on('chatMessage', async ({ username, message }) => {
        io.emit('message', `${username}: ${message}`);

        try {
            const response = await fetch('http://localhost:3000/chat/message', { // Use absolute URL if client and server are different
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, message }),
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('Error storing message:', data.error);
            }
        } catch (error) {
            console.error('Error saving message:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

sequelize.sync()
    .then(() => {
        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('Error syncing database:', err);
    });
