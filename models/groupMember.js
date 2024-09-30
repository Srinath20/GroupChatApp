const { DataTypes } = require('sequelize');
const sequelize = require('../util/db');

const GroupMember = sequelize.define('GroupMember', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    GroupId: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Groups',
            key: 'id'
        }
    },
    UserId: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Users',
            key: 'id'
        }
    }
});

GroupMember.associate = (models) => {
    GroupMember.belongsTo(models.User, { foreignKey: 'UserId' });
    GroupMember.belongsTo(models.Group, { foreignKey: 'GroupId' });
};

module.exports = GroupMember;
