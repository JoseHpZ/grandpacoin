const { isValidAddress } = require('../../utils/functions');
const crypto = require('crypto');
const Transaction = require('./Transaction');
const { clearSingleTransactionData, processBlockTransactions } = require('../../utils/functions');

class Block {
    static getBlockHash(blockObject) {
        return crypto.createHash('sha256')
            .update(JSON.stringify(blockObject))
            .digest('hex');
    }
    static getGenesisBlock() {
        const dateCreated = '2019-11-09T01:05:06.705Z';
        return Block.getBlockObject({
            index: 0,
            transactions: [],
            difficulty: 0,
            prevBlockHash: '0',
            minedBy: '00000000000000000000000000000000',
            nonce: 0,
            dateCreated,
            minerAddress: '00000000000000000000000000000000'
        });
    }
    static getCandidateBlock({index, prevBlockHash, difficulty, transactions, minedBy}) {
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
                minedBy,
                blockDataHash
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
        return {
            index,
            transactions,
            difficulty,
            prevBlockHash,
            minedBy,
            blockDataHash,
            dateCreated,
            nonce,
            blockHash: Block.getBlockHash({blockDataHash, dateCreated, nonce})
        }
    }
}

module.exports = Block;