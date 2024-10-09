const { DataTypes } = require('sequelize');
const sequelize = require('../util/db');

const Message = sequelize.define('Message', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    message: {
        type: DataTypes.STRING,
        allowNull: false
    },
    UserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    },
    groupId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'Groups',
            key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    }
}, {
    tableName: 'Messages'
});

Message.associate = (models) => {
    Message.belongsTo(models.User, { foreignKey: 'UserId', as: 'User' });
    Message.belongsTo(models.Group, { foreignKey: 'groupId', as: 'Group' });
};

module.exports = Message;
