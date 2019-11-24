const crypto = require('crypto');
const Transaction = require('./Transaction');
const { clearSingleTransactionData, getTransactionsFee } = require('../../utils/transactionFunctions');
const BigNumber = require('bignumber.js');
const GranpaCoin = require('../models/GrandpaCoin');
const Validator = require('../../utils/Validator');


class Block extends GranpaCoin {
    static getBlockHash(blockObject) {
        return crypto.createHash('sha256')
            .update(JSON.stringify(blockObject))
            .digest('hex');
    }
    static getGenesisBlock(transactions) {
        return Block.getBlockObject({
            index: 0,
            transactions: [transactions],
            difficulty: 0,
            prevBlockHash: '0',
            minedBy: '00000000000000000000000000000000',
            nonce: 0,
            dateCreated: global.originDate,
            minerAddress: '00000000000000000000000000000000'
        });
    }
    static getCandidateBlock({index, prevBlockHash, difficulty, transactions: pendingTransactions, minedBy}) {
        const transactions = [...pendingTransactions];
        const expectedReward = BigNumber(global.blockReward).plus(getTransactionsFee(transactions)).toString();
        const coinbaseTransaction = Transaction.getCoinbaseTransaction({to: minedBy, value:  expectedReward, data: 'coinbase tx', minedInBlockIndex: index});
        clearSingleTransactionData(coinbaseTransaction);
        transactions.unshift(coinbaseTransaction);

        const blockDataHash = Block.getBlockHash({index, transactions: transactions, difficulty, prevBlockHash, minedBy});
        return {
            miningJob: {
                index,
                transactionsIncluded: transactions.length,
                difficulty,
                expectedReward: expectedReward,
                rewardAddress: minedBy,
                blockDataHash
            },
            [blockDataHash]: {
                index,
                transactions,
                difficulty,
                prevBlockHash: prevBlockHash,
                minedBy,
                blockDataHash,
                expectedReward: expectedReward,
            }
        }
    }
    static getBlockObject({index, transactions, difficulty, prevBlockHash, minedBy, nonce, dateCreated}) {
        const blockDataHash = Block.getBlockHash({
            index,
            transactions,
            difficulty,
            prevBlockHash,
            minedBy
        });
        return new Block({
            index,
            transactions,
            difficulty,
            prevBlockHash,
            minedBy,
            blockDataHash,
            dateCreated,
            nonce,
            blockHash: Block.getBlockHash({blockDataHash, dateCreated, nonce})
        });
    }
    static validDataHash({ index, transactions, difficulty, prevBlockHash, minedBy, blockDataHash }) {
        return blockDataHash === Block.getBlockHash({
            index, transactions, difficulty, prevBlockHash, minedBy
        });
    }

    static validProof({ difficulty, blockHash }) {
        return '0'.repeat(difficulty) === blockHash.slice(0, difficulty);
    }

    static validBlockHash({ blockDataHash, dateCreated, nonce, blockHash }) {
        return  blockHash === Block.getBlockHash({blockDataHash, dateCreated, nonce});
    }

    static isValid(block) {
        const validator = new Validator([
            {
                validations: ['required', 'integer'],
                names: ['index', 'difficulty', 'nonce'],
                values: {
                    index: block.index,
                    difficulty: block.difficulty,
                    nonce: block.nonce
                },
            },
            {
                validations: ['required', 'array'],
                value: block.transactions,
                name: 'transactions',
            },
            {
                validations: ['required', 'string'],
                names: ['minedBy', 'blockDataHash', 'blockHash'],
                values: {
                    minedBy: block.minedBy,
                    blockDataHash: block.blockDataHash,
                    blockHash: block.blockHash
                },
            },
            {
                validations: ['required', 'date'],
                value: block.dateCreated,
                name: 'dateCreated',
            },
            {
                customValidations: [
                    { validation: Block.validProof, message: 'invalid proof.' },
                    { validation: Block.validDataHash, message: 'invalid data hash.' },
                    { validation: Block.validBlockHash, message: 'Invalid block hash.' },
                ],
                value: block,
                name: 'block',
            },
        ]);
        return validator.validate().hasError();
    }
    constructor({index, transactions, difficulty, prevBlockHash, minedBy, nonce, dateCreated, blockDataHash, blockHash}) {
        super();
        this.index = index;
        this.transactions = transactions;
        this.difficulty = difficulty;
        this.prevBlockHash = prevBlockHash;
        this.minedBy = minedBy;
        this.blockDataHash = blockDataHash;
        this.dateCreated = dateCreated;
        this.nonce = nonce;
        this.blockHash = blockHash;
    }
}

module.exports = Block;