const blockchain = require('../models/Blockchain')
const { existsPeer, getPeer, getPeerInfo, addPeer } = require('../models/Peer');
const { withColor, isValidUrl } = require('../../utils/functions');
const ClientSocket = require('./ClientSocket');
const eventEmmiter = require('./eventEmmiter');


class ServerSocket {
    static clientsUrls = {};
    static sockets = {};
    static initializeSocket(server) {
        const io = require('socket.io')(server);
        io.on('connect', (socket) => {
            /**
             * CHANNELS LISTENERS
             */
            socket.on(global.CHANNELS.NEW_CONNECTION, (peerInfo, origin) => {
                console.log(withColor('\n----> new peer request <----', 'yellow'))
                if (typeof peerInfo !== 'object' || Array.isArray(peerInfo) || !isValidUrl(peerInfo.nodeUrl)) {
                    socket.disconnect();
                    return;
                }
                if (getPeerInfo().nodeUrl === peerInfo.nodeUrl) {
                    socket.emit(global.CHANNELS.NEW_CONNECTION, {
                        message: 'Invalid peer URL, you can not connect to your own node.',
                        status: 409,
                    })
                    socket.disconnect();
                    return;
                }
                if (existsPeer(peerInfo.nodeUrl)) {
                    socket.emit(global.CHANNELS.NEW_CONNECTION, {
                        status: 409,
                        message: 'Connection already exists',
                    })
                    socket.disconnect();
                    return;
                }
                 
                // add the peer info
                addPeer({ ...peerInfo, socketId: socket.id });
                ServerSocket.clientsUrls[socket.id] = peerInfo.nodeUrl;
                ServerSocket.sockets[peerInfo.nodeUrl] = socket;
                // add the socket in the room for nodes
                socket.join(global.ROOMS.NODE);
                
                // send the success connection to peer
                socket.emit(global.CHANNELS.NEW_CONNECTION, {
                    status: 200,
                    peerInfo: getPeerInfo(),
                })
                
                io.to(global.ROOMS.PUBLIC).emit(global.CHANNELS.CLIENT_CHANNEL, {
                    actionType: global.CHANNELS_ACTIONS.NEW_PEER,
                    peerInfo,
                })
                
                if (origin === 'client')
                    ServerSocket.createNewClientSocket(peerInfo.nodeUrl);

                console.log(withColor('\nNew peer connected with URL: ') + peerInfo.nodeUrl)
            });

            
            socket.on(global.CHANNELS.PUBLIC_CONNECTION, () => {
                socket.join(global.ROOMS.PUBLIC);
            });
            socket.on(global.CHANNELS.CLIENT_CHANNEL, (data) => ServerSocket.actionsClientHandler(data, socket));
            socket.on('disconnect', () => {
                // console.log('EMIT PEER DISCONNECTION');
                io.to(global.ROOMS.PUBLIC).emit(global.CHANNELS.CLIENT_CHANNEL, {
                    actionType: global.CHANNELS_ACTIONS.REMOVE_PEER,
                    nodeUrl: ServerSocket.clientsUrls[socket.id],
                })
            })
          
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

        eventEmmiter.on(global.EVENTS.notify_block, (info) => {
            console.log(withColor('\nEmmiting block peer request to peer:') + info.nodeUrl);
            io.to(getPeer(info.nodeUrl).socketId).emit(global.CHANNELS.CLIENT_CHANNEL, {
                actionType: global.CHANNELS_ACTIONS.NOTIFY_BLOCK,
                info,
            })
        })

        eventEmmiter.on(global.EVENTS.remove_peer, (nodeUrl) => {
            console.log(withColor('\nEmmiting block peer request to peer:') + info.nodeUrl);
            io.to(getPeer(nodeUrl).socketId).emit(global.CHANNELS.CLIENT_CHANNEL, {
                actionType: global.CHANNELS_ACTIONS.REMOVE_PEER,
                info,
            });
            ServerSocket.sockets[peerInfo.nodeUrl].disconnect();
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
            await new ClientSocket(nodeUrl).connect('server');
        } catch (err) {
            console.log(withColor('\nError while connect with peer ' + nodeUrl + ' Details: ', 'red'), err)
        }
    }
}

module.exports = ServerSocket;

