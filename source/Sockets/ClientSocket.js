const io = require('socket.io-client');
const blockchain = require('../models/Blockchain')
const Peer = require('../models/Peer');
const { withColor } = require('../../utils/functions');


class ClientSocket {
    constructor(peerNodeUrl) {
        this.socket = io(peerNodeUrl, {
            timeout: 10000,
            reconnectionDelay: 3000,
        });
        this.serverNodeUrl = peerNodeUrl;
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.socket.on('connect', () => {
                this.socket.on(global.CHANNELS.NEW_CONNECTION, (peerInfo) => {
                    if (Peer.existsPeer(peerInfo.peerUrl)) {
                        reject({
                            message: 'Connection already exists.',
                            status: 409,
                        });
                        this.socket.disconnect();
                    } else if (global.serverSocketUrl === peerInfo.peerUrl) {
                        reject({
                            message: 'Invalid peer ID.',
                            status: 409,
                        });
                        this.socket.disconnect();
                    } else {
                        this.initializeListeners(peerInfo);
                        console.log(withColor('Connect to peer: ') + peerInfo.peerUrl)
                        resolve();
                    }
                });
            });
          
            this.connectError = this.socket.on('connect_error', this.connectionErrorHandler(reject));
        });
    }

    initializeListeners(peerInfo) {
        Peer.addPeer({...peerInfo, socketId: this.socket.id });
        this.socket.removeAllListeners();
        /**
         * EMITS
         */
        // send data of this node to server
        this.socket.emit(global.CHANNELS.NEW_CONNECTION, Peer.getPeerInfo());

        this.syncronizationDataEmits(peerInfo.cumulativeDifficulty);
        /**
         * global.CHANNELS LISTENERS
         */
        this.socket.on(global.CHANNELS.CLIENT_CHANNEL, (data) => this.clientSocketActionsHandler(data))

        /**
         * EVENTS LISTENERS
         */

        // reconnection with the peer if his server are down and comeback before five attemps
        this.socket.on('reconnect', () => {
            this.reconnectionHandler();
        })
        this.socket.on('reconnecting', (attemps) => {
            if (attemps > 5) {
                this.socket.disconnect();
                console.log(withColor('\nSomething was happen with the server peer: ', 'yellow') + this.serverNodeUrl)
                Peer.removePeer(this.serverNodeUrl);
            } else {
                console.log('attemps: ', attemps)
                console.log(withColor('\ntriying to reconnect with server node id: ') + this.serverNodeUrl);
            }
        })
        
    }

    syncronizationDataEmits(cumulativeDifficulty) {
        // chain data sync
        if (Peer.needSyncronization(cumulativeDifficulty)) {
            this.socket.emit(global.CHANNELS.CLIENT_CHANNEL, {
                actionType: global.CHANNELS_ACTIONS.GET_CHAIN
            })
            console.log('\ngetting the new blockchain...')
        }
        
        // get pending transactions
        this.socket.emit(global.CHANNELS.CLIENT_CHANNEL, { actionType: global.CHANNELS_ACTIONS.GET_PENDING_TX });

    }

    reconnectionHandler() {
        this.socket.emit(global.CHANNELS.NEW_CONNECTION, {
            ...blockchain.getInfo(),
            peerUrl: global.serverSocketUrl, // server socket url is setting when initialize the socket server
        });
        this.socket.emit(global.CHANNELS.CLIENT_CHANNEL, {
            actionType: global.CHANNELS_ACTIONS.GET_INFO,
        })
    }

    connectionErrorHandler = (reject) => (err) =>  {
        if (err.description === 404 || err.description === 503) {
            console.log(withColor('\nPeer not found.', 'yellow'))
            reject({
                message: 'Peer url not found.',
                status: 404,
            });
        } else {
            console.log(withColor('\nUnknown error.', 'yellow'))
            reject({
                message: 'Unknown error, please try again.',
                status: 500,
            });
        }
        this.socket.disconnect();
    }

    clientSocketActionsHandler(data) {
        if (!data.actionType) return;
        switch (data.actionType) {
            case global.CHANNELS_ACTIONS.RECEIVE_INFO:
            case global.CHANNELS_ACTIONS.NOTIFY_BLOCK:
                console.log(withColor('\nRe initialize syncronization with peer.', 'yellow'))
                this.syncronizationDataEmits(data.info.cumulativeDifficulty);
                break;
            case global.CHANNELS_ACTIONS.NEW_CHAIN:
                Peer.validateAndSyncronizeChain(data.chain);
                break;
            case global.CHANNELS_ACTIONS.SET_PENDING_TRANSACTIONS:
                Peer.addPendingTransactions(data.pendingTransactions);
                break;
            case global.CHANNELS_ACTIONS.ADD_NEW_TRANSACTION:
                Peer.addNewTransaction(data.transaction);
                break;
            case global.CHANNELS_ACTIONS.NEW_BLOCK:
                Peer.addNewBlock(data.block);
                break;
            default: return;
        }
    }
}

module.exports = ClientSocket;