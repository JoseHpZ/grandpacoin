const responseData = require('../utils/functions').responseData;
const generateNodeId = require('../utils/functions').generateNodeId;
const Block = require('./Block');
const globalConfigs = require('../global');


class Blockchain {
    constructor() {
        this.initBlockchain();
        this.getBlockByIndex = this.getBlockByIndex.bind(this);
        this.resetChain = this.resetChain.bind(this);
        this.getBlocks = this.getBlocks.bind(this);
    }
    initBlockchain() {
        this.chain = [];
        this.pendingTransactions = [];
        this.confirmedTransactions = [];
        this.blocksCount = 0;
        this.nodes = [];
        this.nodeId = generateNodeId();
        this.chain.push(new Block({
            index: 0,
            prevBlockHash: '0',
            previousDifficulty: 0,
            pendingTransactions: this.pendingTransactions,
            nonce: 0,
            minedBy: '00000000000000000000000000000000'
        }));
        this.getBlock = this.getBlock.bind(this);
        this.getInfo = this.getInfo.bind(this);
    }
    getBlockByIndex(req, response) {
        if (!req.params.index || !this.chain[req.params.index]) {
            return response
                .status(404)
                .json(responseData({ message: 'Block not found' }));
        }
        return response.json(responseData(this.chain[req.params.index]));
    }
    resetChain({ res }) {
        this.initBlockchain();
        return res
            .status(200)
            .json({ message: 'The chain was reset to its genesis block.' });
    }
    getBlocks({ res }) {
        return res
            .status(200)
            .json({data: this.chain});
    }

    getInfo(request, response) {
        return response.json(
            responseData({
                about: globalConfigs.appName,
                nodeId: this.nodeId,
                chainId: 'chainId',
                nodeUrl: 'nodeUrl',
                peers: 'nopeersdeUrl',
                currentDifficult: 'currentDifficult',
                blocksCount: 'blocksCount',
                comulativeDifficulty: 'comulativeDifficulty',
                confirmedTransactions: 'confirmedTransactions',
                pendingTransactions: 'pendingTransactions',
            })
        );
    }
    
}

module.exports = Blockchain;