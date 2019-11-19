const { generateNodeId } = require('../../utils/functions');
const Block = require('./Block');
const Bignumber = require('bignumber.js');


class Blockchain {
    constructor() {
        this.nodeId = generateNodeId();
        this.peers = {};
        this.initBlockchain();
    }

    initBlockchain() {
        this.chain = [];
        this.pendingTransactions = [];
        this.currentDifficulty = global.initialDifficulty;
        this.addresses = {
            'b392c5549575088f096DAd01e0a89bd6DA116bA2': {
                confirmedBalance: '50000',
                safeBalance: '50000',
                pendingBalance: '0',
            },
        };
        this.addressesIds = [];
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
            return new Bignumber(16)
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
    
    addPendingTransaction(newTransaction) {
        this.pendingTransactions.push(newTransaction);
        this.orderPendingTransaction();
    }

    orderPendingTransaction() {
        this.pendingTransactions.sort(function (transactionA, transactionB) {
            if (Bignumber(transactionA.fee).isGreaterThan(transactionB.fee)) {
                return -1;
            }
            if (Bignumber(transactionA.fee).isLessThan(transactionB.fee)) {
                return 1;
            }
            return 0;
        })
    }

}

const blockChain = new Blockchain();
module.exports = blockChain;
