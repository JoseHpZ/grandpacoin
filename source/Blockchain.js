const generateNodeId = require('../utils/functions').generateNodeId;
const Block = require('./Block');
const globalConfigs = require('../global');


class Blockchain {
    constructor() {
        this.initBlockchain();
        this.getBlockByIndex = this.getBlockByIndex.bind(this);
        this.resetChain = this.resetChain.bind(this);
        this.getBlocks = this.getBlocks.bind(this);
        this.getPendingTransactions = this.getPendingTransactions.bind(this);
        this.getConfirmedTransactions = this.getConfirmedTransactions.bind(this);
        this.addBlockToChain = this.addBlockToChain.bind(this);
    }
    initBlockchain() {
        this.chain = [];
        this.pendingTransactions = [];
        this.confirmedTransactions = [];
        this.currentDifficulty = globalConfigs.initialDifficulty,
        this.cumulativeDifficulty = 0;
        this.addresses = [];
        this.nodes = [];
        this.peers = [];
        this.nodeId = generateNodeId();
        this.chain.push(new Block({
            index: 0,
            prevBlockHash: '0',
            previousDifficulty: 0,
            pendingTransactions: this.pendingTransactions,
            nonce: 0,
            minedBy: '00000000000000000000000000000000',
        }));
        this.getBlockByIndex = this.getBlockByIndex.bind(this);
        this.getInfo = this.getInfo.bind(this);
        this.debug = this.debug.bind(this);
    }
    
    getBlockByIndex(req, response) {
        if (!req.params.index || !this.chain[req.params.index]) {
            return response
                .status(404)
                .json({ message: 'Block not found' });
        }
        return response.json(this.chain[req.params.index]);
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
            .json(this.chain);
    }
    getPendingTransactions({ res }) {
        return res
            .status(200)
            .json(this.pendingTransactions);
    }
    getConfirmedTransactions({ res }) {
        return res
            .status(200)
            .json(this.confirmedTransactions);
    }
    addBlockToChain(req) {
        new Block({
            index: this.chain.length,
            prevBlockHash: this.chain[this.chain.length - 1].blockHash,
            previousDifficulty: this.chain[this.chain.length - 1].difficulty,
            pendingTransactions: this.pendingTransactions, 
            minedBy: req.params.minerAddress
        });
    }

    getInfo(req, response) {
        return response.json({
            about: globalConfigs.appName,
            nodeId: this.nodeId,
            peers: this.peers,
            chainId: this.chain[0].blockHash,
            nodeUrl:  req.protocol + '://' + req.get('host'),
            currentDifficult: this.currentDifficulty,
            blocksCount: this.chain.length,
            cumulativeDifficulty: this.cumulativeDifficulty,
            confirmedTransactions: this.confirmedTransactions.length,
            pendingTransactions: this.pendingTransactions.length,
        });
    }

    debug(req, response) {
        return response.json({
            selfUrl: req.protocol + '://' + req.get('host'),
            chain: {
                blocks: this.chain,
                prevBlockHash: this.chain,
            },
            nodeId: this.nodeId,
            peers: this.peers,
            transactions: this.confirmedTransactions,
            currentDifficult: this.currentDifficulty,
            blocksCount: this.chain.length,
            cumulativeDifficulty: this.cumulativeDifficulty,
            confirmedTransactions: this.confirmedTransactions.length,
            pendingTransactions: this.pendingTransactions.length,
        });
    }
    
}

module.exports = Blockchain;