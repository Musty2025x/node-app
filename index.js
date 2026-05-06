const express = require('express');

const app = express();


const PORT = process.env.PORT || 3000;


app.get('/', (req, res) => {

    res.send('🚀 DevOps Capstone App is Running!');

});


app.get('/health', (req, res) => {

    res.json({ status: 'OK' });

});


app.listen(PORT, () => {

    console.log(`Server running on port ${PORT}`);

});