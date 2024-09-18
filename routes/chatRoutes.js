const express = require('express');
const router = express.Router();
const Message = require('../models/message');
const User = require('../models/user');

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
