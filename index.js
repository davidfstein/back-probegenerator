const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const formidable = require('express-formidable');

app.use(cors({credentials: true, origin: true}));

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    next();
});

app.use(formidable({
    uploadDir: './uploads',
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

require('./services/probeService')(app);
require('./services/captchaService')(app);

app.listen(process.env.PORT || 5000)