const io = require('socket.io')();
const { checkPort } = require('./socketsFunctions');
const blockchain = require('../models/Blockchain')
const { CHANNELS, chainActionsHanlder } = require('../Sockets/socketsFunctions');
const { withColor } = require('../../utils/functions');


class ServerSocket {
    constructor() {
        this.port = global.PORT + 1;
        this.findPort();
        this.chainActionsHanlder = chainActionsHanlder.bind(this);
        this.nodesIds = {};
    }

    findPort() {
        checkPort(this.port)
            .then(() => {
                this.initializeSocket();
            })
            .catch(() => {
                console.log(withColor('Socket port ' + this.port + ' is occupied, triying in onother port...', 'red'));
                this.port += 1;
                this.findPort();
            })
    }

    initializeSocket() {
        io.listen(this.port);
        io.on('connect', (socket) => {
            console.log(withColor('\n----> new peer request <----'))
            socket.emit(CHANNELS.INFO, blockchain.getInfo());
            socket.on(CHANNELS.INFO, (peerInfo) => {
                console.log(withColor('connect with peer:') + peerInfo.nodeId)
                blockchain.addPeer(peerInfo)
                this.nodesIds[socket.id] = peerInfo.nodeId;
            });
            socket.on(CHANNELS.CHAIN, this.chainActionsHanlder);
            socket.on('disconnect', () => {
                if (!this.nodesIds[socket.id]) return;
                console.log(withColor('\nPeer diconnected, ID:', 'red') + `${this.nodesIds[socket.id]}`)
                blockchain.removePeer(this.nodesIds[socket.id]);
            })
        })
        console.log(withColor('Server peers socket listening in port:') + this.port);
    }

    
}

module.exports = ServerSocket;