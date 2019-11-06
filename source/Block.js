const crypto = require('crypto');

function Block({index, previousBlockHash, previousProof, pendingTransactions, lastBlock}) {
    class SingleBlock {
        static getBlockHash(lastBlock) {
            return crypto.createHash('sha256')
                .update(JSON.stringify(lastBlock))
                .digest('hex');
        }
    
        constructor() {
            this.index = index;
            this.proof = previousProof;
            this.previousBlockHash = previousBlockHash;
            this.pendingTransactions = pendingTransactions;
            this.lastBlock = lastBlock;
            this.timestamp = Date.now().toISOString();
        }
        getBlock() {
            const { index, previousBlockHash, proof, pendingTransactions: transactions, lastBlock };
            return {
                index,
                timestamp,
                transactions,
                proof,
                previousHash: previousBlockHash || SingleBlock.hash(lastBlock)
            }
        }
    }
    return (new SingleBlock()).getBlock();
}


module.exports = Block;