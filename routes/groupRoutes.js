const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Message = require('../models/message');
const Group = require('../models/group');
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

        // Create UserGroups entries for all members (including creator) as non-admins
        const userGroupsData = [...existingUsers, { id: creatorId }].map(user => ({
            UserId: user.id,
            GroupId: newGroup.id,
            isAdmin: false
        }));

        // Create UserGroups entries
        await UserGroups.bulkCreate(userGroupsData);

        // Update the creator's entry to be an admin
        await UserGroups.update(
            { isAdmin: true },
            { where: { UserId: creatorId, GroupId: newGroup.id } }
        );

        return res.status(201).json({
            success: true,
            message: 'Group created successfully!',
            group: newGroup,
            validNumbers: existingUsers.map(user => user.phone)
        });
    } catch (error) {
        console.error('Error creating group:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

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

router.get('/:groupId/messages', verifyToken, async (req, res) => {
    try {
        const groupId = req.params.groupId;
        const userId = req.user.id;

        // Check if the user is a member of the group
        const userGroup = await UserGroups.findOne({
            where: { UserId: userId, GroupId: groupId }
        });

        if (!userGroup) {
            return res.status(403).json({ success: false, message: 'You are not a member of this group.' });
        }

        const messages = await Message.findAll({
            where: { groupId: groupId },
            include: [{ model: User, as: 'User', attributes: ['name'] }],
            order: [['createdAt', 'ASC']]
        });

        res.json({ success: true, messages: messages });
    } catch (error) {
        console.error('Error fetching group messages:', error);
        res.status(500).json({ success: false, message: 'An error occurred while fetching group messages.' });
    }
});

router.get('/user-groups', verifyToken, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            include: [{
                model: Group,
                as: 'Groups',
                through: { attributes: [] }
            }]
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        res.json({ success: true, groups: user.Groups });
    } catch (error) {
        console.error('Error fetching user groups:', error);
        res.status(500).json({ success: false, message: 'An error occurred while fetching user groups.' });
    }
});

const isGroupAdmin = async (req, res, next) => {
    try {
        const groupId = req.params.groupId;
        const userId = req.user.id;

        const userGroup = await UserGroups.findOne({
            where: { UserId: userId, GroupId: groupId, isAdmin: true }
        });

        if (!userGroup) {
            return res.status(403).json({ success: false, message: 'You are not an admin of this group.' });
        }

        next();
    } catch (error) {
        console.error('Error checking group admin status:', error);
        res.status(500).json({ success: false, message: 'An error occurred while checking admin status.' });
    }
};

// Add a user to the group (admin only)
router.post('/:groupId/add-user', verifyToken, isGroupAdmin, async (req, res) => {
    try {
        const { userPhone } = req.body;
        const groupId = req.params.groupId;

        const user = await User.findOne({ where: { phone: userPhone } });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const [userGroup, created] = await UserGroups.findOrCreate({
            where: { UserId: user.id, GroupId: groupId },
            defaults: { isAdmin: false }
        });

        if (!created) {
            return res.status(400).json({ success: false, message: 'User is already in the group.' });
        }

        res.json({ success: true, message: 'User added to the group successfully.' });
    } catch (error) {
        console.error('Error adding user to group:', error);
        res.status(500).json({ success: false, message: 'An error occurred while adding user to the group.' });
    }
});

router.put('/:groupId/make-admin', verifyToken, async (req, res) => {
    try {
        const { userPhone } = req.body;
        const groupId = req.params.groupId;

        // Check if the requester is an admin of the group
        const requesterGroup = await UserGroups.findOne({
            where: { UserId: req.user.id, GroupId: groupId }
        });

        if (!requesterGroup || !requesterGroup.isAdmin) {
            return res.status(403).json({ success: false, message: 'You do not have permission to make users admin in this group.' });
        }

        // Find the user by phone number
        const user = await User.findOne({ where: { phone: userPhone } });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found with the given phone number.' });
        }

        // Check if the user is in the group
        const userGroup = await UserGroups.findOne({
            where: { UserId: user.id, GroupId: groupId }
        });
        if (!userGroup) {
            return res.status(404).json({ success: false, message: 'User is not in the group.' });
        }

        // Make the user an admin
        await userGroup.update({ isAdmin: true });
        res.json({ success: true, message: 'User is now an admin of the group.' });
    } catch (error) {
        console.error('Error making user an admin:', error);
        res.status(500).json({ success: false, message: 'An error occurred while making the user an admin.' });
    }
});

// Remove a user from the group (admin only)
router.delete('/:groupId/remove-user', verifyToken, isGroupAdmin, async (req, res) => {
    try {
        const { userPhone } = req.body;
        const groupId = req.params.groupId;

        // Find the user by phone number
        const userToRemove = await User.findOne({ where: { phone: userPhone } });

        if (!userToRemove) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        // Find the UserGroup entry
        const userGroup = await UserGroups.findOne({
            where: { UserId: userToRemove.id, GroupId: groupId }
        });

        if (!userGroup) {
            return res.status(404).json({ success: false, message: 'User is not in the group.' });
        }

        // Remove the user from the group
        await userGroup.destroy();

        res.json({ success: true, message: 'User removed from the group successfully.' });
    } catch (error) {
        console.error('Error removing user from group:', error);
        res.status(500).json({ success: false, message: 'An error occurred while removing the user from the group.' });
    }
});

module.exports = router;
