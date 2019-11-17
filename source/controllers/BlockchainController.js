const blockChain = require('../models/Blockchain');
const { appName, coins } = require('../../global');


class BlockchainController {
    static resetChain({ res }) {
        blockChain.initBlockchain();
        return res
            .status(200)
            .json({ message: 'The chain was reset to its genesis block.' });
    }
    
    static getInfo(req, res) {
        return res.json({
            about: appName,
            nodeId: blockChain.nodeId,
            peers: blockChain.peers,
            chainId: blockChain.chain[0].blockHash,
            nodeUrl: req.protocol + '://' + req.get('host'),
            currentDifficult: blockChain.currentDifficulty,
            blocksCount: blockChain.chain.length,
            cumulativeDifficulty: blockChain.getcumulativeDifficult(),
            confirmedTransactions: blockChain.confirmedTransactions.length,
            pendingTransactions: blockChain.pendingTransactions.length,
        });
    }
    
    static getDebug(req, res) {
        return res.json({
            selfUrl: req.protocol + '://' + req.get('host'),
            nodeId: blockChain.nodeId,
            coins: coins,
            peers: blockChain.peers,
            transactions: blockChain.confirmedTransactions,
            currentDifficult: blockChain.currentDifficulty,
            blocksCount: blockChain.chain.length,
            cumulativeDifficulty: blockChain.getcumulativeDifficult(),
            confirmedTransactions: blockChain.confirmedTransactions.length,
            pendingTransactions: blockChain.pendingTransactions.length,
            chain: {
                blocks: blockChain.chain,
                prevBlockHash: blockChain.chain,
            },
        });
    }

}

module.exports = BlockchainController;
