const { DataTypes } = require('sequelize');
const sequelize = require('../util/db');

const Group = sequelize.define('Group', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
});

Group.associate = (models) => {
    Group.belongsToMany(models.User, { through: models.GroupMember, foreignKey: 'GroupId' });
    Group.hasMany(models.Message, { foreignKey: 'GroupId', as: 'Messages' });
};

module.exports = Group;
