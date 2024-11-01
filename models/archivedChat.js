const { DataTypes } = require('sequelize');
const sequelize = require('../util/db');

const ArchivedChat = sequelize.define('ArchivedChat', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    message: {
        type: DataTypes.STRING,
        allowNull: false
    },
    fileUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            isUrl: true
        }
    },
    UserId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    groupId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    archivedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'ArchivedChats'
});

module.exports = ArchivedChat;