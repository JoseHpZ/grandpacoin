const io = require('socket.io-client');
const blockchain = require('../models/Blockchain')
const { CHANNELS ,CHANNELS_ACTIONS, chainActionsHanlder } = require('../Sockets/socketsFunctions');
const { withColor } = require('../../utils/functions');


class ClientSocket {
    constructor(url) {
        this.socket = io(url);
        this.peerUrl = url;
        this.serverNodeId = null;
        this.chainActionsHanlder = chainActionsHanlder.bind(this);
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.socket.on('connect', () => {
                this.socket.on(CHANNELS.INFO, (infoData) => {
                    if (blockchain.peers[infoData.nodeId]) {
                        reject({
                            message: 'Connection already exists.',
                            status: 409,
                        });
                        this.socket.disconnect();
                    } else if (blockchain.nodeId === infoData.nodeId) {
                        reject({
                            message: 'Invalid peer ID.',
                            status: 503,
                        });
                        this.socket.disconnect();
                    } else {
                        this.initializeListeners(infoData);
                        blockchain.addPeer(infoData);
                        this.serverNodeId = infoData.nodeId;
                        console.log(withColor('Connect to peer: ') + infoData.nodeId)
                        resolve();
                    }
                });
            });
            // this.socket.on('connect_timeout', (err) => this.connectionErrorHandler(reject, err))
            this.socket.on('connect_error', (err) => this.connectionErrorHandler(reject, err))
        });
    }

    initializeListeners(infoData) {
        if (blockchain.needSyncronization(infoData.cumulativeDifficulty)) {
            this.socket.emit(CHANNELS.CHAIN, { type: CHANNELS_ACTIONS.GET_CHAIN })
        }
        this.socket.emit(CHANNELS.INFO, blockchain.getInfo())
        this.socket.on(CHANNELS.CHAIN, this.chainActionsHandler)
        this.socket.on('error', function (err) {
            console.log(withColor(`something was happen with the nodeId ${this.serverNodeId}`, 'red'))
            console.log(`Details: ${err}`)
            this.socket.disconnect();
        })
        this.socket.on('disconnect', function () {
            if (!this.serverNodeId) return;
            console.log(withColor('\nPeer diconnected, ID: ', 'red') + `${blockchain.peers[socket.id].nodeId}`)
            blockchain.removePeer(this.serverNodeId);
        });
    }

    connectionErrorHandler(reject, error) {
        console.log(error)
        if (error.description === 503) {
            reject({
                message: 'Invalid peer url.',
                status: 404,
            });
        } else {
            reject({
                message: 'Know error, please try again.',
                status: 500,
            });
        }
        this.socket.disconnect();
    }
    
}

module.exports = ClientSocket;