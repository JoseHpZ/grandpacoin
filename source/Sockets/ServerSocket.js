const blockchain = require('../models/Blockchain')
const { existsPeer, getPeer, getPeerInfo } = require('../models/Peer');
const { withColor, isValidUrl } = require('../../utils/functions');
const ClientSocket = require('./ClientSocket');
const eventEmmiter = require('./eventEmmiter');


class ServerSocket {
    static initializeSocket(server) {
        const io = require('socket.io')(server);
        io.on('connect', (socket) => {
            socket.emit(global.CHANNELS.NEW_CONNECTION, getPeerInfo());
            socket.on(global.CHANNELS.NEW_CONNECTION, (peerInfo) => {
                console.log(withColor('\n----> new peer request <----', 'yellow'))
                if (typeof peerInfo !== 'object' || Array.isArray(peerInfo) || !isValidUrl(peerInfo.nodeUrl)) {
                    socket.disconnect();
                    return;
                }
                // make a new client of this server to the new peer
                if (!existsPeer(peerInfo.nodeUrl)) {
                    socket.join(global.ROOMS.NODE);
                    console.log(withColor('\ntrying connect with peer: ') + peerInfo.nodeUrl)
                    ServerSocket.createNewClientSocket(peerInfo.nodeUrl)
                    // emit the new node connection to public room in client channel
                    io.in(global.ROOMS.PUBLIC).emit(CHANNELS.CLIENT_CHANNEL, {
                        actionType: global.CHANNELS_ACTIONS.NEW_PEER,
                        peerInfo,
                    });
                }
            });
            socket.on(global.CHANNELS.PUBLIC_CONNECTION, () => {
                socket.join(global.ROOMS.PUBLIC);
            });
            socket.on(global.CHANNELS.CLIENT_CHANNEL, (data) => ServerSocket.actionsClientHandler(data, socket));
            // eventEmmiter.on(global.EVENTS.notify_block, (info) => {
            //     console.log(withColor('\nEmmiting new block to peer:') + info.nodeUrl);
            //     if (socket.id === getPeerInfo(info.nodeUrl).socketId) {
            //         socket.emit(global.CHANNELS.CLIENT_CHANNEL, {
            //             actionType: global.CHANNELS_ACTIONS.NOTIFY_BLOCK,
            //             info,
            //         })

            //     }
            // })
        })
        /**
         * Event emiters
         */
        eventEmmiter.on(global.EVENTS.new_chain, (chain) => {
            // emit only for room 'node' the new chain
            io.in(global.ROOMS.NODE).emit(global.CHANNELS.CLIENT_CHANNEL, {
                actionType: global.CHANNELS_ACTIONS.NEW_CHAIN,
                chain,
            })
        })
        eventEmmiter.on(global.EVENTS.new_transaction, (transaction) => {
            console.log(withColor('\nemmiting new transaction to peers...'));
            io.emit(global.CHANNELS.CLIENT_CHANNEL, {
                actionType: global.CHANNELS_ACTIONS.ADD_NEW_TRANSACTION,
                transaction,
            })
        })
        eventEmmiter.on(global.EVENTS.new_block, (block) => {
            console.log(withColor('\nemmiting new block to peers...'));
            io.emit(global.CHANNELS.CLIENT_CHANNEL, {
                actionType: global.CHANNELS_ACTIONS.NEW_BLOCK,
                block,
            })
        })
        
        console.log(withColor('\n******* Server peers socket listening *******', 'yellow'));
    }

    static actionsClientHandler(data, socket) {
        switch (data.actionType) {
            case global.CHANNELS_ACTIONS.GET_CHAIN:
                socket.emit(global.CHANNELS.CLIENT_CHANNEL, {
                    actionType: global.CHANNELS_ACTIONS.NEW_CHAIN,
                    chain: blockchain.chain,
                })
                console.log('\nSending chain to peer...')
                break;
            case global.CHANNELS_ACTIONS.GET_PENDING_TX:
                socket.emit(global.CHANNELS.CLIENT_CHANNEL, {
                    actionType: global.CHANNELS_ACTIONS.SET_PENDING_TRANSACTIONS,
                    pendingTransactions: blockchain.pendingTransactions,
                })
                console.log('\nSending pending transactions to peer...')
                break;
            case global.CHANNELS_ACTIONS.GET_INFO:
                socket.emit(global.CHANNELS.CLIENT_CHANNEL, {
                    actionType: global.CHANNELS_ACTIONS.RECEIVE_INFO,
                    info: getPeerInfo(),
                });
                console.log('\nSending information to peer...')
                break;
            default: return;
        }
    }

    static async createNewClientSocket(nodeUrl) {
        try {
            console.log('\nSender request to be peer client...')
            await new ClientSocket(nodeUrl).connect();
        } catch (err) {
            console.log(withColor('\nError while connect with peer: ', 'red') + nodeUrl + ' Details: ', err)
        }
    }
}

module.exports = ServerSocket;
