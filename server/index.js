const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const newsletterRoutes = require('./routes/newsletterRoutes');

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(cors({
    origin: 'http://127.0.0.1:5500',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
}));

app.use(express.static(path.join(__dirname, '../../front')));

app.use('/', newsletterRoutes);

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
