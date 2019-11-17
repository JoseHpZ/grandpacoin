const { isValidAddress } = require('../../utils/functions');
const blockchain = require('../models/Blockchain');
const Block = require('../models/Block');

let blockNumber = 0;
class BlockController {
    static getMiningJob({ params: { minerAddress }}, res) {
        const address = isValidAddress(minerAddress);
        const block = Block.getCandidateBlock({
            index: blockchain.chain.length,
            prevBlockHash: blockchain.chain[blockchain.chain.length - 1].blockHash,
            difficulty: blockchain.currentDifficulty,
            transactions: blockchain.pendingTransactions,
            // transactions: [blockchain.testingTransaction, blockchain.testingTransaction],
            minedBy: address
        });
        const { miningJob, ...blockCandidate } = block;
        blockchain.storeBlockCandidate(blockCandidate);

        if (!address)
            return res.status(400).json({ message: 'Invalid Address.' });
            
        return res.status(200).json(miningJob);
    }

    static getSubmittedBlock({ body }, res) {
        const { blockHash, blockDataHash, ...blockHeader } = body;
        const blockCandidate = blockchain.getBlockCandidate(blockDataHash);
        if (!blockCandidate)
            return res.status(404).json('Block not found or Block already mined.');

        const newBlock = Block.getBlockObject({
            ...blockCandidate,
            ...blockHeader
        });

        if (newBlock.blockHash === blockHash) {
            blockchain.addBlock(newBlock);
            return res.status(200).json({'message': 'Block accepted', blockNumber: blockNumber += 1, nonce: newBlock.nonce});
        }
        
        return res.status(404).json('The submit block candidate is invalid.')
    }

    static getBlocks({ res }) {
        return res
            .status(200)
            .json(blockchain.chain);
    }

    static getBlockByIndex(req, response) {
        if (!req.params.index || !blockchain.chain[req.params.index]) {
            return response
                .status(404)
                .json({ message: 'Block not found' });
        }
        return response.json(blockchain.chain[req.params.index]);
    }
}

module.exports = BlockController;
