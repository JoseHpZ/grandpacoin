const responseData = require('../utils/functions').responseData;
const Block = require('./Block');
const initialDifficulty = require('../global').initialDifficulty;

class Blockchain {
    constructor() {
        this.initBlockchain();
        this.getBlock = this.getBlock.bind(this);
        this.resetChain = this.resetChain.bind(this);
    }
    initBlockchain() {
        this.chain = [];
        this.pendingTransactions = [];
        this.confirmedTransactions = [];
        this.blocksCount = 0;
        this.nodes = [];
        this.chain.push(new Block({
            index: 0,
            prevBlockHash: '0',
            previousDifficulty: 0,
            pendingTransactions: this.pendingTransactions,
            nonce: 0,
            minedBy: '00000000000000000000000000000000'
        }));
    }
    getBlock(req, response) {
        if (!req.params.index || !this.chain[req.params.index]) {
            return response
                .status(404)
                .json(responseData({ message: 'Block not found' }));
        }
        return response.json(responseData(this.chain[req.params.index]));
    }
    resetChain(request, response) {
        this.initBlockchain();
        return response
            .status(200)
            .json(responseData({ message: 'The chain was reset to its genesis block.' }));
    }
}

module.exports = Blockchain;