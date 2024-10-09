const { DataTypes } = require('sequelize');
const sequelize = require('../util/db');

const UserGroups = sequelize.define('UserGroups', {
    UserId: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    GroupId: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Groups',
            key: 'id'
        }
    }
}, {
    tableName: 'UserGroups'
});

module.exports = UserGroups;