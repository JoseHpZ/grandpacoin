const { generateNodeId } = require('../../utils/functions');
const Block = require('./Block');
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
        this.currentDifficulty = global.initialDifficulty;
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
        if (!transaction) {
            for (const block of this.chain) {
                transaction = block.transactions.find(txn => txn.transactionDataHash === hash)
                if (transaction) break;
            }
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

    addBlock(newBlock) {
        this.chain.push(newBlock);
        this.blockCandidates = {};
    }

    getBlockCandidate(blockDataHash) {
        return this.blockCandidates[blockDataHash];
    }

    storeBlockCandidate(blockCandidate) {
        this.blockCandidates = { ...this.blockCandidates, ...blockCandidate };
    }

}

const blockChain = new Blockchain();
module.exports = blockChain;
