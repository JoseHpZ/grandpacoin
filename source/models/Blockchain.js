const { generateNodeId } = require('../../utils/functions');
const Block = require('./Block');
const BigNumber = require('bignumber.js');
const moment = require('moment');
const { removeTransactionWithoutFunds } = require('../../utils/transactionFunctions')
const Transaction = require('./Transaction');


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
            '999067568fed3f20dd265413e70f48a060dad93c': {
                confirmedBalance: '50000',
                safeBalance: '50000',
                pendingBalance: '0',
            },
        };
        this.addressesIds = [];
        this.blockNumber = 0;
        this.blockCandidates = {};
        this.totalBlockTime = 0;
        this.generateGenesisBlock();
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
        const lastBlockDate = this.getLastBlock().dateCreated;
        this.chain.push(newBlock);
        this.adjustDifficulty(newBlock.dateCreated, lastBlockDate);
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

    adjustDifficulty(newBlockDate, lastBlockDate) {
        if (this.chain.length > 1) {
            const lastBlockTime = BigNumber(moment(lastBlockDate).unix());
            const newBlockTime =  BigNumber(this.totalBlockTime).plus(moment(newBlockDate).unix());
            this.totalBlockTime = newBlockTime.toString();
        }
    }

    getLastBlock() {
        return this.chain[this.chain.length - 1];
    }

    orderPendingTransaction() {
        this.pendingTransactions.sort(function (transactionA, transactionB) {
            if (BigNumber(transactionA.fee).isGreaterThan(transactionB.fee)) {
                return -1;
            }
            if (BigNumber(transactionA.fee).isLessThan(transactionB.fee)) {
                return 1;
            }
            return 0;
        })
    }

    removeInvalidPendingTransactions() {
        this.pendingTransactions = removeTransactionWithoutFunds(this.pendingTransactions, this.addresses);
    }

    getAddressData(address) {
        return this.addresses[address];
    }

    setAddressData(address, data) {
        this.addresses[address] = data;
    }

    generateGenesisBlock() {
        const faucetTransaction = Transaction.genesisTransaction();
        this.chain.push(Block.getGenesisBlock(faucetTransaction));
        this.setAddressData(faucetTransaction.to, {
            safeBalance: faucetTransaction.value,
            confirmedBalance: faucetTransaction.value,
            pendingBalance: '0',
        });
    }

}

const blockChain = new Blockchain();
module.exports = blockChain;
