require('dotenv').config();//To Use Env variables

const express = require('express');
const path = require('path');
const sequelize = require('./util/db');
const userRoutes = require('./routes/userRoutes');
const PORT = process.env.PORT || 3000;
const app = express();
const cors = require('cors');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

sequelize.sync()
    .then(app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    }))
    .catch(err => {
        console.error('Error syncing database:', err);
    });

app.use(express.static(path.join(__dirname, 'views')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'signup.html'));
});

app.use('/user', userRoutes);
