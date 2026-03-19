require('dotenv').config()
const express = require('express');
const app = express(); 


app.get('/server-health', (req, res) => {
    res.send(`Server is Healthy`);
});

app.listen(process.env.PORT, () => {
    console.log(`Server is running fine on the Port ${process.env.PORT}`);
})