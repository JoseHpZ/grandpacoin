const { unprefixedAddress } = require('../../utils/functions');
const { removeDuplicateSender } = require('../../utils/transactionFunctions');
const Validator = require('../../utils/Validator');
const blockchain = require('../models/Blockchain');
const Block = require('../models/Block');
const Address = require('../models/Address');
const eventEmmiter = require('../Sockets/eventEmmiter');


class BlockController {
    static async getMiningJob({ params: { minerAddress } }, res) {
        const validator = new Validator([{
            validations: ['isValidAddress'],
            name: 'minerAddress',
            value: minerAddress,
        }])
        if (validator.validate().hasError())
            return res.status(400).json({ message: 'Invalid block or block already mined.' });

        blockchain.removeInvalidPendingTransactions();
        const block = Block.getCandidateBlock({
            index: blockchain.chain.length,
            prevBlockHash: blockchain.chain[blockchain.chain.length - 1].blockHash,
            difficulty: blockchain.currentDifficulty,
            transactions: removeDuplicateSender(blockchain.pendingTransactions),
            minedBy: unprefixedAddress(minerAddress)
        });
        const { miningJob, ...blockCandidate } = block;
        blockchain.storeBlockCandidate(blockCandidate);
        return res.status(200).json(miningJob);
    }

    static async getSubmittedBlock({ body }, res) {
        const { blockHash, blockDataHash, ...blockHeader } = body;
        if (blockHash.length !== 64 || blockDataHash.length !== 64)
            return res.status(400).json({ message: 'Invalid data.' });

        const blockCandidate = blockchain.getBlockCandidate(blockDataHash);
        if (!blockCandidate)
            return res.status(404).json({ message: 'Block not found or Block already mined.' });

        const newBlock = Block.getBlockObject({
            ...blockCandidate,
            ...blockHeader
        });

        if (newBlock.blockHash === blockHash && (newBlock.index === blockchain.getLastBlock().index + 1)) {
            // const transactions = Address.varifyGetAndGenerateBalances(newBlock);
            const transactions = Address.getTransactionsStatuses(block);
            Address.calculateBlockchainBalances();
            blockchain.addBlock({ ...newBlock, transactions });
            blockchain.calculateCumulativeDifficult();
            eventEmmiter.emit(global.EVENTS.new_block, newBlock); // emit event to Server Socket
            return res.status(200).json({
                message: 'Block accepted reward paid: ' + blockCandidate.expectedReward + ' Grandson.'
            });
        }

        return res.status(404).json({ message: 'Block not found or Block already mined.' });
    }

    static async getBlocks(req, res) {
        let blocks;
        if (req.query.latest && req.query.latest.toLowerCase() === 'true') {
            blocks = blockchain.chain.slice(-3);
        } else {
            blocks = blockchain.chain;
        }
        return res
            .status(200)
            .json(blocks);
    }

    static async getBlockByIndex(req, response) {
        if (!req.params.index || !blockchain.chain[req.params.index]) {
            return response
                .status(404)
                .json({ message: 'Block not found' });
        }
        return response.json(blockchain.chain[req.params.index]);
    }

    static async getBlockByHash({ params: { hash }}, res) {
        const validator = new Validator([{
            validations: ['isValidBlockHash'],
            name: 'hash',
            value: hash,
        }])
        if (validator.validate().hasError())
            return res.status(400).json(validator.getErrors());

        const block = blockchain.chain.find(block => block.blockHash === hash)
        if (block) {
            return res.json(block);
        } else {
            return res.status(404).json({ message: 'Block not found.' });
        }
    }
}

module.exports = BlockController;
