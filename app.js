require('./global');
const express = require('express');
const app = express();
const routes = require('./source/routes.js');
const PORT = process.env.PORT || 5555;
const router = express.Router();
const { setCorsHeadersMiddleware } = require('./utils/cors');

console.clear()
console.log('----------------------------------------------')
app.listen(PORT, function () {
    console.log('App listening on port: ' + PORT);
});
app.use(setCorsHeadersMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(router);


routes(router);
console.clear()
