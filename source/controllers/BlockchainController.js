const blockchain = require('../models/Blockchain');
const Validator = require('../../utils/Validator');
const MiningJob = require('../models/MiningJob');
const Block = require('../models/Block');


class BlockchainController {
    static resetChain({ res }) {
        blockchain.initBlockchain();
        return res
            .status(200)
            .json({ message: 'The chain was reset to its genesis block.' });
    }
    
    static getInfo(req, res) {
        return res.json({
            about: global.appName,
            nodeId: blockchain.nodeId,
            peers: blockchain.peers,
            chainId: blockchain.chain[0].blockHash,
            nodeUrl: req.protocol + '://' + req.get('host'),
            currentDifficult: blockchain.currentDifficulty,
            blocksCount: blockchain.chain.length,
            cumulativeDifficulty: blockchain.getcumulativeDifficult(),
            confirmedTransactions: blockchain.confirmedTransactions.length,
            pendingTransactions: blockchain.pendingTransactions.length,
        });
    }
    
    static getDebug(req, res) {
        return res.json({
            selfUrl: req.protocol + '://' + req.get('host'),
            nodeId: blockchain.nodeId,
            coins: global.coins,
            peers: blockchain.peers,
            transactions: blockchain.confirmedTransactions,
            currentDifficult: blockchain.currentDifficulty,
            blocksCount: blockchain.chain.length,
            cumulativeDifficulty: blockchain.getcumulativeDifficult(),
            confirmedTransactions: blockchain.confirmedTransactions.length,
            pendingTransactions: blockchain.pendingTransactions.length,
            chain: {
                blocks: blockchain.chain,
                prevBlockHash: blockchain.chain,
            },
        });
    }
    static debugMining({ params: { minerAddress, difficulty }}, res) {
        const validator = new Validator([
            {
                validations: [
                    'isValidAddress'
                ],
                name: 'minerAddress',
                value: minerAddress
            },
            {
                validations: [
                    'integer'
                ],
                name: 'difficulty',
                value: difficulty
            }
        ]);
        if (validator.validate().hasError()) {
            return res.status(400).json(validator.getErrors())
        };

        const miningJob = MiningJob.get({ minerAddress, difficulty });

        const minedBlock = MiningJob.createBlockHash({difficulty: parseInt(miningJob.difficulty), blockDataHash: miningJob.blockDataHash});
        const { blockHash, blockDataHash, ...blockHeader } = minedBlock;

        const blockCandidate = blockchain.getBlockCandidate(blockDataHash);
        if (!blockCandidate)
            return res.status(404).json('Block not found or Block already mined.');

        const newBlock = Block.getBlockObject({
            ...blockCandidate,
            ...blockHeader
        });

        if (newBlock.blockHash === blockHash) {
            if (newBlock.index === blockchain.getLastBlock().index + 1) {
                blockchain.addBlock(newBlock);
                return res.status(200).json({
                    message: 'Block accepted reward paid: ' + blockCandidate.expectedReward + ' Grandson.'
                });
            }
            return res.status(404).json('Block not found or Block already mined.');
        }
        
        return res.status(404).json({message: 'Block not found or Block already mined.'});
    }

}

module.exports = BlockchainController;
