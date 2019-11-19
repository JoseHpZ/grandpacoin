const { generateNodeId } = require('../../utils/functions');
const Block = require('./Block');
const BigNumber = require('bignumber.js');
const moment = require('moment');


class Blockchain {
    constructor() {
        this.nodeId = generateNodeId();
        this.peers = {};
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
        this.chain.push(Block.getGenesisBlock());
        this.blockNumber = 0;
        this.blockCandidates = {};
        this.totalBlockTime = 0;
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
        const lastBlockUnixTime = moment(this.getLastBlock().dateCreated).unix().toString();
        this.chain.push(newBlock);
        const newBlockUnixTime = moment(newBlock.dateCreated).unix();
        // this.adjustDifficulty(newBlockUnixTime, lastBlockUnixTime);
        this.blockCandidates = {};
    }

    getBlockCandidate(blockDataHash) {
        return this.blockCandidates[blockDataHash];
    }

    storeBlockCandidate(blockCandidate) {
        this.blockCandidates = { ...this.blockCandidates, ...blockCandidate };
    }

    adjustDifficulty(newBlockUnixTime, lastBlockUnixTime) {
        if (this.chain.length > 2) {
            const blockTimeDif =  BigNumber(newBlockUnixTime).minus(lastBlockUnixTime).toString();
            this.totalBlockTime = BigNumber(this.totalBlockTime).plus(blockTimeDif).toString();
            const averageTime = BigNumber(this.totalBlockTime).dividedBy(this.chain.length);
            
            if (averageTime.isLessThan(5)) {
                this.currentDifficulty += 1;
            } else if (averageTime.isGreaterThanOrEqualTo(1)) {
                this.currentDifficulty -= 1;
            }
        }
    }
    getLastBlock() {
        return this.chain[this.chain.length - 1];
    }
}

const blockChain = new Blockchain();
module.exports = blockChain;
