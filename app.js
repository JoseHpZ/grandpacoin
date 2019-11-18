require('./global');
const express = require('express');
const app = express();
const routes = require('./source/routes.js');
const PORT = process.env.PORT || 5555;
const router = express.Router();

app.listen(PORT, function () {
    console.log('App listening on port: ' + PORT);
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(router);

routes(router);

