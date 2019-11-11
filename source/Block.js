const crypto = require('crypto');
const clearEmptyTransactionsData = require('../utils/functions').clearEmptyTransactionsData;

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
        static getCandidateBlock({index, prevBlockHash, previousDifficulty, pendingTransactions: transactions, minerAddress}) {
            transactions = clearEmptyTransactionsData(transactions);
            const blockDataHash = Block.getBlockHash({index, transactions, previousDifficulty, prevBlockHash, minerAddress});
            return {
                miningJob: {
                    index,
                    transactionsIncluded: transactions.length,
                    difficulty: previousDifficulty,
                    expectedReward: 5000000,
                    rewardAddress: minerAddress,
                    blockDataHash
                },
                [blockDataHash]: {
                    index,
                    transactions,
                    difficulty: previousDifficulty,
                    prevBlockHash: prevBlockHash,
                    minedBy: minerAddress,
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