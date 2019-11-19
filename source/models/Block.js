const crypto = require('crypto');
const Transaction = require('./Transaction');
const { clearSingleTransactionData, getTransactionsFee } = require('../../utils/transactionFunctions');
const BigNumber = require('bignumber.js');
const GranpaCoin = require('../models/GrandpaCoin');

class Block extends GranpaCoin {
    static getBlockHash(blockObject) {
        return crypto.createHash('sha256')
            .update(JSON.stringify(blockObject))
            .digest('hex');
    }
    static getGenesisBlock() {
        return Block.getBlockObject({
            index: 0,
            transactions: [Transaction.genesisTransaction()],
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
        const minerReward = getTransactionsFee(transactions);
        const coinbaseTransaction = Transaction.getCoinbaseTransaction({to: minedBy, value: minerReward, data: 'coinbase tx', minedInBlockIndex: index});
        clearSingleTransactionData(coinbaseTransaction);
        transactions.unshift(coinbaseTransaction);

        const blockDataHash = Block.getBlockHash({index, transactions: transactions, difficulty, prevBlockHash, minedBy});
        return {
            miningJob: {
                index,
                transactionsIncluded: transactions.length,
                difficulty,
                expectedReward: BigNumber(global.blockReward).plus(minerReward).toString(),
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
                expectedReward: BigNumber(global.blockReward).plus(minerReward).toString(),
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