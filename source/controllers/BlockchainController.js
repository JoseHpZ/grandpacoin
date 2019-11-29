const blockchain = require('../models/Blockchain');
const Validator = require('../../utils/Validator');
const MiningJob = require('../models/MiningJob');
const Block = require('../models/Block');
const Address = require('../models/Address');
const { unprefixedAddress } = require('../../utils/functions');
const eventEmmiter = require('../Sockets/eventEmmiter');
const { getIPAddress } = require('../Sockets/socketsFunctions');

class BlockchainController {
    static async resetChain({ res }) {
        blockchain.initBlockchain();
        return res
            .status(200)
            .json({ message: 'The chain was reset to its genesis block.' });
    }

    static async getInfo(req, res) {
        return res.json({
            about: global.appName,
            nodeId: blockchain.nodeId,
            nodeUrl: req.protocol + '://' + getIPAddress() + ':' + global.PORT,
            peers: blockchain.peers,
            chainId: blockchain.chain[0].blockHash,
            currentDifficult: blockchain.currentDifficulty,
            blocksCount: blockchain.chain.length,
            cumulativeDifficulty: blockchain.cumulativeDifficulty,
        });
    }

    static async getDebug(req, res) {
        return res.json({
            nodeUrl: req.protocol + '://' + getIPAddress() + ':' + global.PORT,
            nodeId: blockchain.nodeId,
            peers: blockchain.peers,
            currentDifficult: blockchain.currentDifficulty,
            blocksCount: blockchain.chain.length,
            cumulativeDifficulty: blockchain.cumulativeDifficulty,
            coins: global.coins,
            addresses: Address.getAddressesBalances(),
            pendingTransactionsQuantity: blockchain.pendingTransactions.length,
            pendingTransactions: blockchain.pendingTransactions,
            transactions: blockchain.getConfirmedTransactions(),
            chain: blockchain.chain,
        });
    }

    static async debugMining({ params: { minerAddress, difficulty } }, res) {
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
        const miningJob = MiningJob.get({ minerAddress: unprefixedAddress(minerAddress), difficulty });

        const minedBlock = MiningJob.createBlockHash({ difficulty: parseInt(miningJob.difficulty), blockDataHash: miningJob.blockDataHash });
        const { blockHash, blockDataHash, ...blockHeader } = minedBlock;


        const blockCandidate = blockchain.getBlockCandidate(blockDataHash);
        if (!blockCandidate)
            return res.status(404).json('Block not found or Block already mined.');

        const newBlock = Block.getBlockObject({
            ...blockCandidate,
            ...blockHeader
        });

        if (newBlock.blockHash === blockHash && newBlock.index === blockchain.getLastBlock().index + 1) {
            const transactions = Address.varifyGetAndGenerateBalances(newBlock);
            blockchain.addBlock({ ...newBlock, transactions });
            blockchain.calculateCumulativeDifficult();
            eventEmmiter.emit(global.EVENTS.new_block, newBlock); // emit event to Server Socket
            return res.status(200).json({
                message: 'Block accepted. Reward paid: ' + blockCandidate.expectedReward + ' Grandson.'
            });
        }

        return res.status(404).json({ message: 'Block not found or Block already mined.' });
    }

}

module.exports = BlockchainController;
