const responseData = require('../utils/functions').responseData;
const generateNodeId = require('../utils/functions').generateNodeId;
const Block = require('./Block');
const globalConfigs = require('../global');
const Transaction = require('./Transaction');


class Blockchain {
    constructor() {
        this.initBlockchain();
        this.getBlockByIndex = this.getBlockByIndex.bind(this);
        this.resetChain = this.resetChain.bind(this);
        this.getBlocks = this.getBlocks.bind(this);
        this.getTransactionByHash = this.getTransactionByHash.bind(this);
        this.sendTransaction = this.sendTransaction.bind(this);
    }
    initBlockchain() {
        this.chain = [];
        this.pendingTransactions = [];
        this.confirmedTransactions = [];
        this.blocksCount = 0;
        this.nodes = [];
        this.nodeId = generateNodeId();
        this.chain.push(new Block({
            index: 0,
            prevBlockHash: '0',
            previousDifficulty: 0,
            pendingTransactions: this.pendingTransactions,
            nonce: 0,
            minedBy: '00000000000000000000000000000000'
        }));
        this.getBlocks = this.getBlocks.bind(this);
        this.getInfo = this.getInfo.bind(this);
    }
    getBlockByIndex(req, response) {
        if (!req.params.index || !this.chain[req.params.index]) {
            return response
                .status(404)
                .json(responseData({ message: 'Block not found' }));
        }
        return response.json(responseData(this.chain[req.params.index]));
    }
    resetChain({ res }) {
        this.initBlockchain();
        return res
            .status(200)
            .json({ message: 'The chain was reset to its genesis block.' });
    }
    getBlocks({ res }) {
        return res
            .status(200)
            .json({ data: this.chain });
    }

    getInfo(request, response) {
        return response.json(
            responseData({
                about: globalConfigs.appName,
                nodeId: this.nodeId,
                chainId: 'chainId',
                nodeUrl: 'nodeUrl',
                peers: 'nopeersdeUrl',
                currentDifficult: 'currentDifficult',
                blocksCount: 'blocksCount',
                comulativeDifficulty: 'comulativeDifficulty',
                confirmedTransactions: 'confirmedTransactions',
                pendingTransactions: 'pendingTransactions',
            })
        );
    }

    getTransactionByHash(request, response) {
        const hash = request.params.hash;

        if (!/^([A-Fa-f0-9]{64})$/.test(hash)) {
            return response
                .status(400)
                .json({ message: 'Invalid transaction hash' })
        }

        let transaction = this.confirmedTransactions.find(txn => txn.transactionDataHash === hash)

        if (transaction) return response.status(200).json(transaction)

        transaction = this.pendingTransactions.find(txn => txn.transactionDataHash === hash)

        if (transaction) return response.status(200).json(transaction)

        return response
            .status(404)
            .json({ message: 'Transaction not found' })
    }

    sendTransaction(request, response) {
        const { from, to, value, fee, senderPubKey, data, senderSignature } = request.body;

        if (!/^([A-Fa-f0-9]{40})$/.test(from)) {
            return response
                .status(400)
                .json({ message: "Invalid 'from' address" })
        }

        if (!/^([A-Fa-f0-9]{40})$/.test(to)) {
            return response
                .status(400)
                .json({ message: "Invalid 'to' address" })
        }

        if (!/^([A-Fa-f0-9]{65})$/.test(senderPubKey)) {
            return response
                .status(400)
                .json({ message: "Invalid sender public key" })
        }

        if (!/^([A-Fa-f0-9]{64})$/.test(senderSignature)) {
            return response
                .status(400)
                .json({ message: "Invalid sender signature" })
        }

        this.pendingTransactions.push(Transaction(from, to, value, fee, senderPubKey, data, senderSignature).data)

        return response
            .status(200)
            .json(this.pendingTransactions[this.pendingTransactions.length - 1])
    }
}

module.exports = Blockchain;