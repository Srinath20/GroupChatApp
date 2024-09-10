const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('groupchat', 'root', 'Srinathg99', {
    host: 'localhost',
    dialect: 'mysql'
});

module.exports = sequelize;
