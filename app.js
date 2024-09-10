const express = require('express');
const path = require('path');
const sequelize = require('./util/db');
const userRoutes = require('./routes/userRoutes');
const PORT = 3000;
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

