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
    },
    isAdmin: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'UserGroups'
});

UserGroups.associate = (models) => {
    UserGroups.belongsTo(models.User, { foreignKey: 'UserId' });
    UserGroups.belongsTo(models.Group, { foreignKey: 'GroupId' });
};

module.exports = UserGroups;