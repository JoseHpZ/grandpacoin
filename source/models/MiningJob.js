const blockchain = require('../models/Blockchain');
const Block = require('../models/Block');
const BigNumber = require('bignumber.js');
const crypto = require('crypto');
const { removeDuplicateSender } = require('../../utils/transactionFunctions');


class MiningJob {

    static createBlockHash({ difficulty, blockDataHash }) {
        let nonce = BigNumber(0);
        let dateCreated = (new Date()).toISOString();  
        let hash = '';

        while (difficulty > hash.match(/^0*/)[0].length) {
            hash = crypto.createHash('sha256')
                .update(JSON.stringify({
                    blockDataHash,
                    dateCreated,
                    nonce
                }))
                .digest('hex');

            if (difficulty > hash.match(/^0*/)[0].length) {
                nonce = nonce.plus(1);
                dateCreated = (new Date()).toISOString();
            }

        }
        return {
            blockDataHash,
            dateCreated,
            nonce: nonce.toString(),
            blockHash: hash
        };
    }
    static get({ minerAddress, difficulty }) {
        
        const block = Block.getCandidateBlock({
            index: blockchain.chain.length,
            prevBlockHash: blockchain.chain[blockchain.chain.length - 1].blockHash,
            difficulty,
            transactions: removeDuplicateSender(blockchain.pendingTransactions),
            minedBy: minerAddress
        });
        const { miningJob, ...blockCandidate } = block;
        blockchain.storeBlockCandidate(blockCandidate);
        return miningJob;
    }
}

module.exports = MiningJob;