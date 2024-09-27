const { DataTypes } = require('sequelize');
const sequelize = require('../util/db');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    phone: {
        type: DataTypes.STRING(10),
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

User.associate = (models) => {
    User.hasMany(models.Message, { foreignKey: 'UserId', as: 'Messages' });
};

module.exports = User;