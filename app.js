const express = require('express');
const app = express();
const routes = require('./source/routes.js');
const PORT = process.env.PORT || 3333;

app.listen(PORT, function () {
    console.log('App listening on port: ' + PORT);
});
app.use(express.json());

routes(app);

