const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Message = require('../models/message');
const Group = require('../models/Group');
const UserGroups = require('../models/userGroups');
const jwt = require('jsonwebtoken');

router.post('/create', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Authentication token required' });
        }
        const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
        const creatorId = decoded.id;

        const { name, members } = req.body;

        if (!Array.isArray(members)) {
            return res.status(400).json({ message: 'Members should be an array of phone numbers' });
        }

        const existingUsers = [];
        const missingUsers = [];

        for (let phone of members) {
            const user = await User.findOne({ where: { phone: phone.trim() } });
            if (user) {
                existingUsers.push(user);
            } else {
                missingUsers.push(phone);
            }
        }
        if (missingUsers.length > 0) {
            return res.status(400).json({
                message: `The following phone numbers do not exist: ${missingUsers.join(', ')}`,
                missingNumbers: missingUsers,
                validNumbers: existingUsers.map(user => user.phone)
            });
        }
        const newGroup = await Group.create({
            name: name,
            createdBy: creatorId
        });
        const userGroupsData = existingUsers.map(user => ({
            UserId: user.id,
            GroupId: newGroup.id
        }));
        userGroupsData.push({
            UserId: creatorId,
            GroupId: newGroup.id
        });
        await UserGroups.bulkCreate(userGroupsData);

        return res.status(201).json({
            message: 'Group created successfully!',
            group: newGroup,
            validNumbers: existingUsers.map(user => user.phone)
        });
    } catch (error) {
        console.error('Error creating group:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});



module.exports = router;
