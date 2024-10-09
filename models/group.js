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
    createdBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    }
}, {
    tableName: 'Groups'
});

Group.associate = (models) => {
    Group.belongsTo(models.User, { foreignKey: 'createdBy', as: 'Creator' });
    Group.belongsToMany(models.User, { through: 'UserGroups', as: 'Members' });
    Group.hasMany(models.Message, { foreignKey: 'groupId', as: 'Messages' });
};

module.exports = Group;
