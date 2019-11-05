const express = require('express');
var app = express()
const Blockchain = require('./source/Blockchain.js');
const routes = require('./source/routes.js');
const PORT = process.env.PORT || 3333;

app.listen(PORT, function () {
    console.log('App listening on port: ' + PORT);
});
app.use(express.json());

const blockchain = new Blockchain();
routes(app, blockchain);

