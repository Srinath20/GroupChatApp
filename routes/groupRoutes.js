const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Message = require('../models/message');
const Group = require('../models/Group');
const jwt = require('jsonwebtoken');

router.post('/create', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Authentication token required' });
        }

        // Decode the token to get the user ID of the creator
        const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
        const creatorId = decoded.id;

        const { name, members } = req.body;

        // Split the phone numbers into an array
        const phoneNumbers = members.split(',');

        // To store existing and non-existing users
        const existingUsers = [];
        const missingUsers = [];

        // Loop through each phone number and check if the user exists
        for (let phone of phoneNumbers) {
            const user = await User.findOne({ where: { phone: phone.trim() } });
            if (user) {
                existingUsers.push(user);
            } else {
                missingUsers.push(phone);
            }
        }
        // If there are any missing users, inform the client
        if (missingUsers.length > 0) {
            return res.status(400).json({
                message: `The following phone numbers do not exist: ${missingUsers.join(', ')}`
            });
        }


    }
    catch {

    }
})


module.exports = router;
