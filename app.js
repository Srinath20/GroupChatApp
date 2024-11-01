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
const multer = require('multer');
const multerS3 = require('multer-s3');
const { v4: uuidv4 } = require('uuid');
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const AWS = require('aws-sdk');
const upload = multer();
const cron = require('cron');
const ArchivedChat = require('./models/archivedChat');
const { Op } = require('sequelize');

async function archiveOldMessages() {
    const oneDayAgo = new Date(new Date().setDate(new Date().getDate() - 1));

    try {
        const oldMessages = await Message.findAll({
            where: {
                createdAt: { [Op.lt]: oneDayAgo }
            }
        });

        if (oldMessages.length > 0) {
            const archivedChatsData = oldMessages.map(message => ({
                message: message.message,
                fileUrl: message.fileUrl,
                UserId: message.UserId,
                groupId: message.groupId,
                archivedAt: new Date()
            }));
            await ArchivedChat.bulkCreate(archivedChatsData);

            await Message.destroy({
                where: {
                    createdAt: { [Op.lt]: oneDayAgo }
                }
            });

            console.log(`Archived and deleted ${oldMessages.length} old messages.`);
        } else {
            console.log('No messages to archive.');
        }
    } catch (error) {
        console.error('Error archiving messages:', error);
    }
}

const archiveJob = new cron.CronJob('0 0 * * *', archiveOldMessages, null, true, 'UTC');

function uploadToS3(data, fileName) {
    const BUCKET_NAME = process.env.BUCKET_NAME;
    const IAM_USER_KEY = process.env.IAM_USER_KEY;
    const IAM_USER_SECRET = process.env.IAM_USER_SECRET;

    try {
        const s3bucket = new AWS.S3({
            accessKeyId: IAM_USER_KEY,
            secretAccessKey: IAM_USER_SECRET,
            region: process.env.AWS_REGION,
        });
        const params = {
            Bucket: BUCKET_NAME,
            Key: fileName,
            Body: data,
            ACL: 'public-read'
        };

        return new Promise((resolve, reject) => {
            s3bucket.upload(params, (err, s3Response) => {
                if (err) {
                    console.error('Something went wrong', err);
                    reject(err);
                } else {
                    resolve(s3Response.Location);
                }
            });
        });
    } catch (error) {
        console.error('Error in uploadToS3:', error);
        throw error;
    }
}

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
app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        const fileExtension = req.file.originalname.split('.').pop();
        const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;

        const fileUrl = await uploadToS3(req.file.buffer, uniqueFileName);

        res.json({ success: true, fileUrl });

    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ error: 'File upload failed' });
    }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: process.env.BASE_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

app.use(express.static(path.join(__dirname, 'views')));
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(403).json({
            success: false,
            message: 'No token provided.'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
        req.user = { id: decoded.id };
        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: 'Failed to authenticate token.'
        });
    }
};

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

    socket.on('groupMessage', async ({ username, message, groupId, fileUrl }) => {
        try {
            const user = await User.findOne({ where: { name: username } });
            if (user) {
                const newMessage = await Message.create({
                    message,
                    UserId: user.id,
                    groupId: groupId,
                    fileUrl
                });

                const messageWithUser = await Message.findOne({
                    where: { id: newMessage.id },
                    include: [{ model: User, as: 'User', attributes: ['name'] }]
                });

                io.to(`group_${groupId}`).emit('newMessage', messageWithUser);
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

sequelize.sync({ alter: true })
    .then(() => {
        console.log('Database & tables created!');
        archiveJob.start();
        console.log('Cron job started for archiving 1 day old messages.');
        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('Error syncing database:', err);
    });

