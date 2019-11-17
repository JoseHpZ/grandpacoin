const { isValidAddress } = require('../../utils/functions');
const blockChain = require('../models/Blockchain');
const Block = require('../models/Block');


class BlockController {
    static getMiningJob({ params: { minerAddress }}, res) {
        const address = isValidAddress(minerAddress);
        const block = Block.getCandidateBlock({
            index: blockChain.chain.length,
            prevBlockHash: blockChain.chain[blockChain.chain.length - 1].blockHash,
            difficulty: blockChain.currentDifficulty,
            transactions: blockChain.pendingTransactions,
            // transactions: [blockChain.testingTransaction, blockChain.testingTransaction],
            minedBy: address
        });
        const { miningJob, ...blockCandidate } = block;
        blockChain.blockCandidates = { ...blockChain.blockCandidates, ...blockCandidate };

        if (!address)
            return res.status(400).json({ message: 'Invalid Address.' });
            
        return res.status(200).json(miningJob);
    }

    static getSubmittedBlock({ body }, res) {
        const { blockHash, blockDataHash, ...blockHeader } = body;
        const blockCandidate = blockChain.blockCandidates[blockDataHash];
        if (!blockCandidate)
            return res.status(404).json('Block not found or Block already mined.');

        const newBlock = Block.getBlockObject({
            ...blockCandidate,
            ...blockHeader
        });

        if (newBlock.blockHash === blockHash) {
            this.chain.push(newBlock);
            this.blockCandidates = {};
            return res.status(200).json({'message': 'Block accepted', blockNumber: this.blockNumber += 1})
        }
        
        return res.status(404).json('The submit block candidate is invalid.')
    }

    static getBlocks({ res }) {
        return res
            .status(200)
            .json(blockChain.chain);
    }

    static getBlockByIndex(req, response) {
        if (!req.params.index || !blockChain.chain[req.params.index]) {
            return response
                .status(404)
                .json({ message: 'Block not found' });
        }
        return response.json(blockChain.chain[req.params.index]);
    }
}

module.exports = BlockController;
