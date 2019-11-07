const crypto = require('crypto');

function Block({index, prevBlockHash, previousDifficulty, pendingTransactions, nonce, minedBy}) {
    class BlockchainBlock {
        static getBlockHash(blockObject) {
            return crypto.createHash('sha256')
                .update(JSON.stringify(blockObject))
                .digest('hex');
        }
    
        constructor() {
            this.index = index;
            this.difficulty = previousDifficulty;
            this.prevBlockHash = prevBlockHash;
            this.pendingTransactions = pendingTransactions;
            this.dateCreated = (new Date()).toISOString();
            this.nonce = nonce;
            this.minedBy = minedBy;
        }
        getBlock() {
            const { index, prevBlockHash, difficulty, pendingTransactions: transactions, nonce, minedBy, dateCreated } = this;
            const blockDataHash = BlockchainBlock.getBlockHash({index, transactions, difficulty, prevBlockHash, minedBy});
            return {
                index,
                transactions,
                difficulty,
                prevBlockHash: prevBlockHash,
                minedBy,
                blockDataHash,
                nonce,
                dateCreated,
                blockHash: BlockchainBlock.getBlockHash({blockDataHash, nonce, dateCreated})
            }
        }
    }
    return (new BlockchainBlock()).getBlock();
}


module.exports = Block;