const crypto = require('crypto');
const processBlockTransactions = require('../utils/functions').processBlockTransactions;
const Transaction = require('./Transaction');
const clearSingleTransactionData = require('../utils/functions').clearSingleTransactionData;

class Block {
    static getBlockHash(blockObject) {
        return crypto.createHash('sha256')
            .update(JSON.stringify(blockObject))
            .digest('hex');
    }
    static getGenesisBlock() {
        const dateCreated = '2019-11-09T01:05:06.705Z';
        const blockDataHash = Block.getBlockHash({
            index: 0, 
            transactions: [], 
            difficulty: 0, 
            prevBlockHash: '0', 
            minedBy: '00000000000000000000000000000000'
        });
        
        return {
            index: 0,
            transactions: [],
            difficulty: 0,
            prevBlockHash: '0',
            minedBy: '00000000000000000000000000000000',
            blockDataHash,
            nonce: 0,
            dateCreated,
            blockHash: Block.getBlockHash({blockDataHash, nonce: 0, dateCreated})
        }
    }
    static getCandidateBlock({index, prevBlockHash, previousDifficulty: difficulty, pendingTransactions: transactions, minerAddress: minedBy}) {
        const processedTransactions = processBlockTransactions(transactions);
        const coinbaseTransaction = Transaction.getCoinbaseTransaction({to: minedBy, value: processedTransactions.acumulatedFees, data: 'coinbase tx', minedInBlockIndex: index});
        clearSingleTransactionData(coinbaseTransaction);
        processedTransactions.transactions.unshift(coinbaseTransaction);

        const blockDataHash = Block.getBlockHash({index, transactions: processedTransactions.transactions, difficulty, prevBlockHash, minedBy});
        return {
            miningJob: {
                index,
                transactionsIncluded: transactions.length,
                difficulty,
                expectedReward: 5000000 + processedTransactions.acumulatedFees,
                rewardAddress: minedBy,
                blockDataHash
            },
            [blockDataHash]: {
                index,
                transactions,
                difficulty,
                prevBlockHash: prevBlockHash,
                minedBy: minedBy,
                blockDataHash
            }
        }
    }

    constructor({}) {
        this.index = index;
        this.difficulty = previousDifficulty;
        this.prevBlockHash = prevBlockHash;
        this.pendingTransactions = pendingTransactions;
        this.dateCreated = dateCreated;
        this.nonce = nonce;
        // this.minedBy = minedBy;
        this.createBlock = this.createBlock.bind(this);
    }
    createBlock() {

    }
    
}

module.exports = Block;