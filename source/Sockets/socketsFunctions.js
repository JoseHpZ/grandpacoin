const net = require("net");
const server = net.createServer();
const blockchain = require('../models/Blockchain');

const CHANNELS = {
    INFO: 'INFO',
    CHAIN: 'CHAIN',
}
const CHANNELS_ACTIONS = {
    GET_CHAIN: 'GET_CHAIN',
    SET_CHAIN: 'SET_CHAIN',
}

function checkPort(port) {
    return new Promise((resolve, reject) => {
        try {
            server.once("error", (err) => {
                reject()
            });
            server.once("listening", () => {
                server.close();
                resolve();
            });
            server.listen(port);
    
        } catch (err) {
            reject(err);
        }
    });
}

function chainActionsHanlder(data) {
    if (!data.type) return;
    switch (data.type) {
        // case CHANNELS_ACTIONS.GET_CHAIN:
        //     socket.emit(CHANNELS.CHAIN, {
        //         type: CHANNELS_ACTIONS.SET_CHAIN,
        //         chain: blockchain.chain,
        //     })
        default: return;
    }
}


module.exports = {
    checkPort,
    CHANNELS,
    CHANNELS_ACTIONS,
    chainActionsHanlder,
}