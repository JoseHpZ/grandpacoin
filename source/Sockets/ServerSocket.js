const io = require('socket.io')();
const { checkPort } = require('./socketsFunctions');
const blockchain = require('../models/Blockchain')
const Peer = require('../models/Peer');
const { CHANNELS, CHANNELS_ACTIONS ,singleSocketActionsHandler } = require('../Sockets/socketsFunctions');
const { withColor } = require('../../utils/functions');
const ClientSocket = require('./ClientSocket');
const eventEmmiter = require('./eventEmmiter');


class ServerSocket {
    static port = 6000;
    static hosts = {};

    static get port() {
        return this.port;
    }

    static set port(value) {
        this.port = value;
    }
    
    static create() {
        ServerSocket.findPort();
    }

    static emit(channel, data) {
        if (io.clients.length > 0)
            io.emit(channel, data);
    }

    static getServerSocketUrl(port) {
        return new Promise((resolve, reject) => {
            require('dns').lookup(require('os').hostname(), function (err, address, fam) {
                if (!err) {
                    resolve(`http://${address}:${port}`);
                } else {
                    reject(err);
                }
            })
        })
    }

    static findPort() {
        checkPort(ServerSocket.port)
            .then(() => {
                return ServerSocket.getServerSocketUrl(ServerSocket.port);
            })
            .then((socketHostUrl) => {
                global.serverSocketUrl = socketHostUrl;
                this.initializeSocket();
            })
            .catch(() => {
                console.log(withColor('Socket port ' + ServerSocket.port + ' is occupied, triying in onother port...', 'yellow'));
                ServerSocket.port += 1;
                this.findPort();
            })
    }

    static initializeSocket() {
        io.listen(ServerSocket.port);
        io.on('connect', (socket) => {
            console.log(withColor('\n----> new peer request <----'))
            socket.emit(CHANNELS.NEW_CONNECTION, {
                ...blockchain.getInfo(),
                nodeUrl: global.serverSocketUrl,
            });
            socket.on(CHANNELS.NEW_CONNECTION, (peerInfo) => {
                // make a new client of this server to the new peer
                if (!Peer.existsPeer(peerInfo.nodeUrl)) {
                    console.log(withColor('\ntrying connect with peer: ') + peerInfo.nodeUrl)
                    ServerSocket.createNewClientSocket(peerInfo.nodeUrl)
                    ServerSocket.hosts[socket.id] = peerInfo.nodeUrl;
                }
            });

            socket.on(CHANNELS.SINGLE_SOCKET_CHANNEL, (data) => singleSocketActionsHandler(data, socket));
            
            eventEmmiter.on('new_chain', (chain) => {
                io.emit(CHANNELS.SINGLE_SOCKET_CHANNEL, {
                    actionType: CHANNELS_ACTIONS.NEW_CHAIN,
                    chain,
                })
            })
            eventEmmiter.on('new_transaction', (transaction) => {
                console.log(withColor('\nemmiting new transaction to peers...'));
                io.emit(CHANNELS.SINGLE_SOCKET_CHANNEL, {
                    actionType: CHANNELS_ACTIONS.ADD_NEW_TRANSACTION,
                    transaction,
                })
            })
            // socket.on('disconnect', () => {
            //     if (!ServerSocket.hosts[socket.id]) return;
            //     console.log(withColor('\nPeer diconnected, ID:', 'yellow') + `${ServerSocket.hosts[socket.id]}`)
            //     Peer.removePeer(ServerSocket.hosts[socket.id]);
            // })
        })
        console.log(withColor('Server peers socket listening in port:') + this.port);
    }

    static async createNewClientSocket(peerUrl) {
        try {
            console.log('sending request')
            await new ClientSocket(peerUrl).connect();
        } catch (err) {
            console.log(withColor('Error while connect with peer: ', 'red') + peerUrl + ' Details: ' + err)
        }
    }
}

module.exports = ServerSocket;