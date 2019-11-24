const io = require('socket.io-client');
const blockchain = require('../models/Blockchain')
const Peer = require('../models/Peer');
const {
    CHANNELS ,CHANNELS_ACTIONS, singleSocketActionsHandler,
 } = require('../Sockets/socketsFunctions');
const { withColor } = require('../../utils/functions');


class ClientSocket {
    constructor(peerUrl) {
        this.socket = io(peerUrl, {
            timeout: 10000,
            reconnectionDelay: 3000,
        });
        this.peerUrl = peerUrl;
        this.serverNodeId = null;
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.socket.on('connect', () => {
                this.socket.on(CHANNELS.NEW_CONNECTION, (infoData) => {
                    if (Peer.existsPeer(infoData.nodeUrl)) {
                        reject({
                            message: 'Connection already exists.',
                            status: 409,
                        });
                        this.socket.disconnect();
                    } else if (blockchain.nodeUrl === infoData.nodeUrl) {
                        reject({
                            message: 'Invalid peer ID.',
                            status: 409,
                        });
                        this.socket.disconnect();
                    } else {
                        this.serverNodeId = infoData.nodeUrl;
                        this.initializeListeners(infoData);
                        Peer.addPeer(infoData);
                        console.log(withColor('Connect to peer: ') + infoData.nodeUrl)
                        resolve();
                    }
                });
            });
          
            this.connectError = this.socket.on('connect_error', this.connectionErrorHandler(reject));
        });
    }

    initializeListeners(infoData) {
        this.socket.removeAllListeners('connect_error');
        /**
         * EMITS
         */
        // send data of this node to server
        this.socket.emit(CHANNELS.NEW_CONNECTION, {
            ...blockchain.getInfo(),
            nodeUrl: global.serverSocketUrl, // server socket url is setting when initialize the socket server
        });

        // chain data sync
        if (blockchain.needSyncronization(infoData.cumulativeDifficulty)) {
            this.socket.emit(CHANNELS.SINGLE_SOCKET_CHANNEL, {
                actionType: CHANNELS_ACTIONS.GET_CHAIN
            })
            console.log('getting the new blockchain')
        }
        
        // get pending transactions
        this.socket.emit(CHANNELS.SINGLE_SOCKET_CHANNEL, { actionType: CHANNELS_ACTIONS.GET_PENDING_TX });

        /**
         * CHANNELS LISTENERS
         */
        this.socket.on(CHANNELS.SINGLE_SOCKET_CHANNEL, (data) => singleSocketActionsHandler(data, this.socket))

        /**
         * EVENTS LISTENERS
         */

        // reconnection with the peer if his server are down and comeback before five attemps
        this.socket.on('reconnect', () => {
            console.log('reconnect...')
            this.socket.emit(CHANNELS.NEW_CONNECTION, {
                ...blockchain.getInfo(),
                nodeUrl: global.serverSocketUrl, // server socket url is setting when initialize the socket server
            });
        })
        this.socket.on('reconnecting', (attemps) => {
            if (attemps > 5) {
                this.socket.disconnect();
                console.log(withColor('Something was happen with the server peer: ', 'yellow') + this.serverNodeId)
                Peer.removePeer(this.serverNodeId);
            } else {
                console.log(withColor('\ntriying to reconnect with server node id: ') + this.serverNodeId);
            }
        })
        
    }

    connectionErrorHandler = (reject) => (err) =>  {
        if (err.description === 503 || err.description === 404) {
            console.log(withColor('Peer not found.', 'yellow'))
            reject({
                message: 'Peer url not found.',
                status: 404,
            });
        } else {
            console.log(withColor('Uknow error.', 'yellow'))
            reject({
                message: 'Uknow error, please try again.',
                status: 500,
            });
        }
        this.socket.disconnect();
    }
}

module.exports = ClientSocket;