const io = require('socket.io')();
const { checkPort, getIPAddress } = require('./socketsFunctions');
const blockchain = require('../models/Blockchain')
const { existsPeer, getPeer, getPeerInfo } = require('../models/Peer');
const { withColor } = require('../../utils/functions');
const ClientSocket = require('./ClientSocket');
const eventEmmiter = require('./eventEmmiter');


class ServerSocket {
    static port = 6000;

    static create() {
        ServerSocket.findPort();
    }

    static findPort() {
        checkPort(ServerSocket.port)
            .then(() => {
                global.SERVER_SOCKET_PORT = ServerSocket.port
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
            // socket.join(global.ROOMS.PUBLIC);
            socket.emit(global.CHANNELS.NEW_CONNECTION, getPeerInfo());
            socket.on(global.CHANNELS.NEW_CONNECTION, (peerInfo) => {
                // make a new client of this server to the new peer
                if (!existsPeer(peerInfo.peerUrl)) {
                    console.log(withColor('\ntrying connect with peer: ') + peerInfo.peerUrl)
                    ServerSocket.createNewClientSocket(peerInfo.peerUrl, socket)
                }
            });

            socket.on(global.CHANNELS.CLIENT_CHANNEL, (data) => ServerSocket.actionsHandler(data));
        })
        eventEmmiter.on(global.EVENTS.new_chain, (chain) => {
            io.emit(global.CHANNELS.CLIENT_CHANNEL, {
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
            console.log(withColor('\nEmmiting new block to peer:') + info.nodeUrl);
            io.to(getPeer(info.peerUrl).socketId).emit(global.CHANNELS.CLIENT_CHANNEL, {
                actionType: global.CHANNELS_ACTIONS.NOTIFY_BLOCK,
                info,
            })
        })
        console.log(withColor('Server peers socket listening in port:') + this.port);
    }

    static actionsHandler(data) {
        switch (data.actionType) {
            case global.CHANNELS_ACTIONS.GET_CHAIN:
                io.emit(global.CHANNELS.CLIENT_CHANNEL, {
                    actionType: global.CHANNELS_ACTIONS.NEW_CHAIN,
                    chain: blockchain.chain,
                })
                break;
            case global.CHANNELS_ACTIONS.GET_PENDING_TX:
                io.emit(global.CHANNELS.CLIENT_CHANNEL, {
                    actionType: global.CHANNELS_ACTIONS.SET_PENDING_TRANSACTIONS,
                    pendingTransactions: blockchain.pendingTransactions,
                })
                console.log('\nSending pending transactions...')
                break;
            case global.CHANNELS_ACTIONS.GET_INFO:
                io.emit(global.CHANNELS.CLIENT_CHANNEL, {
                    actionType: global.CHANNELS_ACTIONS.RECEIVE_INFO,
                    info: {
                        ...blockchain.getInfo(),
                        peerUrl: global.serverSocketUrl,
                    },
                });
                console.log('\nSending information...')
                break;
            default: return;
        }
    }

    static async createNewClientSocket(peerUrl, socket) {
        try {
            console.log('\nSender request to be peer client...')
            await new ClientSocket(peerUrl).connect();
        } catch (err) {
            console.log(socket.disconnect())
            console.log(withColor('\nError while connect with peer: ', 'red') + peerUrl + ' Details: ', err)
        }
    }
}

module.exports = ServerSocket;