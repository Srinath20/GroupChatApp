const express = require('express');
const path = require('path');
const sequelize = require('./util/db');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const User = require('./models/user');
const Message = require('./models/message');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;

// Set up associations
const models = { User, Message };
Object.keys(models).forEach(modelName => {
    if ('associate' in models[modelName]) {
        models[modelName].associate(models);
    }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

app.use(express.static(path.join(__dirname, 'views'))); // Serve static files from the views folder

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'signup.html'));
});

app.use('/user', userRoutes);
app.use('/chat', chatRoutes);

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('joinChat', (username) => {
        socket.username = username;
        io.emit('userJoined', `${username} joined the chat`);
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
                console.log('New message created:', messageWithUser.toJSON()); // debugging
                io.emit('newMessage', messageWithUser);
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