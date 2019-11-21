const { generateNodeId } = require('../../utils/functions');
const Block = require('./Block');
const BigNumber = require('bignumber.js');
const moment = require('moment');
const { removeTransactionWithoutFunds, removePendingTransactions } = require('../../utils/transactionFunctions')
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
        this.addresses = {};
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

    addPendingTransaction(newTransaction) {
        this.pendingTransactions.push(newTransaction);
        this.orderPendingTransaction();
    }

    adjustDifficulty(newBlockUnixTime, lastBlockUnixTime) {
        if (this.chain.length > 2) {
            const blockTimeDif = BigNumber(newBlockUnixTime).minus(lastBlockUnixTime).toString();
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

    orderPendingTransaction() {
        this.pendingTransactions.sort(function (transactionA, transactionB) {
            if (BigNumber(transactionA.fee).isGreaterThan(transactionB.fee) || BigNumber(transactionA.value).isGreaterThan(transactionB.value)) {
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

    setAddressData(address, data) {
        this.addresses[address] = data;
    }

    generateGenesisBlock() {
        const faucetTransaction = Transaction.genesisTransaction();
        this.chain.push(Block.getGenesisBlock(faucetTransaction));
        this.setAddressData(faucetTransaction.to, {
            safeBalance: '0',
            confirmedBalance: faucetTransaction.value,
            pendingBalance: '0',
        });
    }

    getConfirmedTransactions() {
        let confirmedTransactions = [];

        this.chain.forEach((block) => {
            confirmedTransactions = [...confirmedTransactions, ...block.transactions]
        })

        return confirmedTransactions;
    }
    filterTransfersPendingTransactions(transactions) {
        this.pendingTransactions = removePendingTransactions(this.pendingTransactions, transactions);
    }

    
}

const blockChain = new Blockchain();
module.exports = blockChain;
