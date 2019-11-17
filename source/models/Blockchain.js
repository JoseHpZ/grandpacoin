const { generateNodeId } = require('../../utils/functions');
const Block = require('./Block');
const { initialDifficulty } = require('../../global');
const BigNumber = require('bignumber.js');


class Blockchain {
    constructor() {
        this.nodeId = generateNodeId();
        this.peers = [];
        this.initBlockchain();
    }

    initBlockchain() {
        this.chain = [];
        this.confirmedTransactions = [];
        this.confirmedTransactionsData = {}; // to store transactions history
        this.pendingTransactions = [];
        this.currentDifficulty = initialDifficulty;
        this.addresses = {};
        this.addressesIds = []; 
        this.nodes = [];
        this.peers = [];
        this.nodeId = generateNodeId();
        this.chain.push(Block.getGenesisBlock());
        this.blockNumber = 0;
        this.blockCandidates = {};
    }

    getTransactionByHash(hash) {
        let transaction = this.pendingTransactions.find(txn => txn.transactionDataHash === hash)
        if (transaction)
            return transaction;
        for (let i = 0; i < this.chain.length; i += 1) {
            transaction = this.chain[i].transactions.find(txn => txn.transactionDataHash === hash)
            if (transaction)
                break;
        }
        return transaction;
    }

    getcumulativeDifficult() {
        return this.chain.reduce((cumulativeDifficulty, block) => {
            return new BigNumber(16)
                .exponentiatedBy(block.difficulty)
                .plus(cumulativeDifficulty)
                .toString()
        }, "0");
    }

}

const blockChain = new Blockchain();
module.exports = blockChain;
