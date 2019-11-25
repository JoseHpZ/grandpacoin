require('./global');
const express = require('express');
const app = express();
const routes = require('./source/routes.js');
const router = express.Router();
const { setCorsHeadersMiddleware } = require('./utils/cors');
const { checkPort } = require('./source/Sockets/socketsFunctions');
const { withColor } = require('./utils/functions');
// socket server
const ServerSocket = require('./source/Sockets/ServerSocket');
const server = require('http').Server(app)

app.use(setCorsHeadersMiddleware);

console.clear()
console.log('----------------------------------------------')
global.PORT = 5555;
function initializeApp() {
    checkPort(global.PORT)
        .then(() => {
            server.listen(global.PORT, () => {
                console.log(withColor('App listening on port: ') + global.PORT);
            });
            app.on('error', (err) => {
                console.log(err)
            })
            app.use(setCorsHeadersMiddleware);
            app.use(express.json());
            app.use(express.text());
            app.use(express.urlencoded({ extended: true }));
            app.use(router);
            ServerSocket.create();
            routes(router);
            
        }).catch(() => {
            console.log(withColor(`Application PORT ${global.PORT} occupied, try on onother port...`, 'yellow'))
            global.PORT += 1;
            initializeApp();
        })
}

initializeApp();

