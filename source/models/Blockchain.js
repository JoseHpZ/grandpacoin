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
        this.pendingTransactions = [
            {
                "from": "0xb392c5549575088f096DAd01e0a89bd6DA116bA2",
                "to": "0xb392c5549575088f096DAd01e0a89bd6DA116bA0",
                "data": "sdsdfsd",
                "fee": "44",
                "value": "21",
                "senderPubKey": "8da4ef21b864d2cc526dbdb2a120bd2874c36c9d0a1fb7f8c63d7f7a8b41de8af",
                "senderSignature": [
                    "8da4ef21b864d2cc526dbdb2a120bd2874c36c9d0a1fb7f8c63d7f7a8b41de8a",
                    "8da4ef21b864d2cc526dbdb2a120bd2874c36c9d0a1fb7f8c63d7f7a8b41de8f"
                ]
            },
            {
                "from": "0xb392c5549575088f096DAd01e0a89bd6DA116bA2",
                "to": "0xb392c5549575088f096DAd01e0a89bd6DA116bA0",
                "data": "sdsdfsd",
                "fee": "22",
                "value": "80",
                "senderPubKey": "8da4ef21b864d2cc526dbdb2a120bd2874c36c9d0a1fb7f8c63d7f7a8b41de8af",
                "senderSignature": [
                    "8da4ef21b864d2cc526dbdb2a120bd2874c36c9d0a1fb7f8c63d7f7a8b41de8a",
                    "8da4ef21b864d2cc526dbdb2a120bd2874c36c9d0a1fb7f8c63d7f7a8b41de8f"
                ]
            },
            {
                "from": "0xb392c5549575088f096DAd01e0a89bd6DA116bA1",
                "to": "0xb392c5549575088f096DAd01e0a89bd6DA116bA0",
                "data": "sdsdfsd",
                "fee": "15",
                "value": "20",
                "senderPubKey": "8da4ef21b864d2cc526dbdb2a120bd2874c36c9d0a1fb7f8c63d7f7a8b41de8af",
                "senderSignature": [
                    "8da4ef21b864d2cc526dbdb2a120bd2874c36c9d0a1fb7f8c63d7f7a8b41de8a",
                    "8da4ef21b864d2cc526dbdb2a120bd2874c36c9d0a1fb7f8c63d7f7a8b41de8f"
                ]
            }
        ];
        this.currentDifficulty = global.initialDifficulty;
        this.addresses = {

            'b392c5549575088f096DAd01e0a89bd6DA116bA2': {
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
        this.pendingTransactions = removeTransactionWithoutFunds(this.pendingTransactions);
        console.log('this.pendingTransactions', this.pendingTransactions)
    }

    getAddress(address) {
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
