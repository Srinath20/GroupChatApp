const { DataTypes } = require('sequelize');
const sequelize = require('../util/db');

const Message = sequelize.define('Message', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    message: {
        type: DataTypes.STRING,
        allowNull: false
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
});

Message.associate = (models) => {
    Message.belongsTo(models.User);
};

module.exports = Message;