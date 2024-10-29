const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const path = require('path');
const sequelize = require('./util/db');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const groupRoutes = require('./routes/groupRoutes');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const User = require('./models/user');
const Group = require('./models/group');
const Message = require('./models/message');
const UserGroups = require('./models/userGroups');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT;

const models = {
    User,
    Group,
    Message,
    UserGroups
};
Object.keys(models).forEach(modelName => {
    if ('associate' in models[modelName]) {
        models[modelName].associate(models);
    }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: process.env.BASE_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

app.use(express.static(path.join(__dirname, 'views'))); // Serve static files from the views folder

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'signup.html'));
});

app.use('/user', userRoutes);
app.use('/chat', chatRoutes);
app.use('/group', groupRoutes);

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('joinChat', (username) => {
        socket.username = username;
        socket.broadcast.emit('userJoined', `${username} joined the chat`);
    });

    socket.on('joinGroup', (groupId) => {
        socket.join(`group_${groupId}`);
    });

    socket.on('groupMessage', async ({ username, message, groupId }) => {
        try {
            const user = await User.findOne({ where: { name: username } });
            if (user) {
                const newMessage = await Message.create({
                    message,
                    UserId: user.id,
                    groupId: groupId
                });

                const messageWithUser = await Message.findOne({
                    where: { id: newMessage.id },
                    include: [{ model: User, as: 'User', attributes: ['name'] }]
                });

                // Broadcast to all clients in the group except the sender
                socket.to(`group_${groupId}`).emit('newMessage', messageWithUser);
            } else {
                console.error('User not found for the given username');
            }
        } catch (error) {
            console.error('Error saving group message:', error);
        }
    });

    socket.on('chatMessage', async ({ username, message }) => {
        try {
            const user = await User.findOne({ where: { name: username } });
            if (user) {
                const newMessage = await Message.create({
                    message,
                    UserId: user.id
                });

                const messageWithUser = await Message.findOne({
                    where: { id: newMessage.id },
                    include: [{ model: User, as: 'User', attributes: ['name'] }]
                });
                // Broadcast to all clients except the sender
                socket.broadcast.emit('newMessage', messageWithUser);
            } else {
                console.error('User not found for the given username');
            }
        } catch (error) {
            console.error('Error saving message:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

// Sync database and start server
sequelize.sync({ force: false })
    .then(() => {
        console.log('Database & tables created!');
        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('Error syncing database:', err);
    });

