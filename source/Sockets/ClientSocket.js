const io = require('socket.io-client');
const Peer = require('../models/Peer');
const { withColor } = require('../../utils/functions');


class ClientSocket {
    constructor(peerNodeUrl) {
        this.socket = io(peerNodeUrl, {
            timeout: 10000,
            reconnectionDelay: 2000,
        });
        this.serverNodeUrl = peerNodeUrl;
    }

    connect(origin = 'client') {
        return new Promise((resolve, reject) => {
            this.socket.on('connect', () => {
                this.socket.emit(global.CHANNELS.NEW_CONNECTION, Peer.getPeerInfo(), origin);
                this.socket.on(global.CHANNELS.NEW_CONNECTION, (data) => {
                    if (data.status !== 200) {
                        reject({
                            message: data.message,
                            status: data.status,
                        });
                        this.socket.disconnect();
                    } else {
                        this.initializeListeners(data.peerInfo);
                        console.log(withColor('Connected to peer: ') + data.peerInfo.nodeUrl)
                        resolve();
                    }
                });
            });

            this.connectError = this.socket.on('connect_error', this.connectionErrorHandler(reject));
        });
    }

    initializeListeners(peerInfo) {
        this.socket.removeAllListeners();
        /**
         * EMITS
         */
        // send data of this node to server
        // this.socket.emit(global.CHANNELS.NEW_CONNECTION, Peer.getPeerInfo());

        this.syncronizationDataEmits(peerInfo.cumulativeDifficulty);
        /**
         * global.CHANNELS LISTENERS
         */
        this.socket.on(global.CHANNELS.CLIENT_CHANNEL, (data) => this.clientSocketActionsHandler(data))

        /**
         * EVENTS LISTENERS
         */

        // reconnection with the peer if his server are down
        this.socket.on('reconnect', () => {
            this.reconnectionHandler();
        })
        this.socket.on('reconnecting', (attemps) => {
            if (attemps > 15) { // try to reconnect 15
                this.socket.disconnect();
                console.log(withColor('\nSomething happened with the peer server: ', 'yellow') + this.serverNodeUrl)
                Peer.removePeer(this.serverNodeUrl);
            } else {
                console.log('attemps: ', attemps)
                console.log(withColor('\nTriying to reconnect with server node id: ') + this.serverNodeUrl);
            }
        })

    }

    syncronizationDataEmits(cumulativeDifficulty) {
        // chain data sync
        if (Peer.needSyncronization(cumulativeDifficulty)) {
            this.socket.emit(global.CHANNELS.CLIENT_CHANNEL, {
                actionType: global.CHANNELS_ACTIONS.GET_CHAIN
            })
        } else {
            // get pending transactions
            this.socket.emit(global.CHANNELS.CLIENT_CHANNEL, {
                actionType: global.CHANNELS_ACTIONS.GET_PENDING_TX
            });
            console.log(withColor('\ngetting pengin transactions', 'cyan'))
        }

    }

    reconnectionHandler() {
        Peer.removePeer(this.serverNodeUrl);
        this.socket.emit(global.CHANNELS.NEW_CONNECTION, Peer.getPeerInfo(), 'client');
        this.socket.on(global.CHANNELS.NEW_CONNECTION, (data) => {
            console.log(data)
        });
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
                this.syncronizationDataEmits(data.info.cumulativeDifficulty);
                break;
            case global.CHANNELS_ACTIONS.NEW_CHAIN:
                Peer.validateAndSyncronizeChain(data.chain, this.socket);
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
            case global.CHANNELS_ACTIONS.REMOVE_PEER:
                this.socket.disconnect();
                Peer.removePeer(this.serverNodeUrl);
                console.log(withColor('\nPeer disconnected by request of node URL: ', 'yellow') + this.serverNodeUrl)
                break;
            default: return;
        }
    }
}

module.exports = ClientSocket;


