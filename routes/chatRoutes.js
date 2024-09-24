const express = require('express');
const router = express.Router();
const Message = require('../models/message');
const User = require('../models/user');

// GET /chat/messages - Get all chat messages
router.get('/messages', async (req, res) => {
    try {
        const messages = await Message.findAll({
            include: [{ model: User, attributes: ['name'] }],
            order: [['createdAt', 'ASC']]
        });
        console.log('Fetched messages:', messages);
        res.status(200).json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// POST /chat/message - Save chat message to the database
router.post('/message', async (req, res) => {
    const { message, username } = req.body;

    try {
        const user = await User.findOne({ where: { name: username } });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const newMessage = await Message.create({
            message,
            userId: user.id
        });

        res.status(201).json(newMessage);
    } catch (error) {
        console.error('Error saving message:', error);
        res.status(500).json({ error: 'Failed to save message' });
    }
});

module.exports = router;