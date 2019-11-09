const { generateNodeId, isValidAddress, isValidPubKey, isValidSignature, isValidTransactionHash } = require('../utils/functions');
const Block = require('./Block');
const globalConfigs = require('../global');
const Transaction = require('./Transaction');


class Blockchain {
    constructor() {
        this.nodeId = generateNodeId();
        this.peers = [];
        this.initBlockchain();
        this.getBlockByIndex = this.getBlockByIndex.bind(this);
        this.resetChain = this.resetChain.bind(this);
        this.getBlocks = this.getBlocks.bind(this);
        this.getTransactionByHash = this.getTransactionByHash.bind(this);
        this.sendTransaction = this.sendTransaction.bind(this);
        this.getPendingTransactions = this.getPendingTransactions.bind(this);
        this.getConfirmedTransactions = this.getConfirmedTransactions.bind(this);
        this.addBlockToChain = this.addBlockToChain.bind(this);
        this.getAddressesBalances = this.getAddressesBalances.bind(this);
        this.getBlockByIndex = this.getBlockByIndex.bind(this);
        this.getInfo = this.getInfo.bind(this);
        this.debug = this.debug.bind(this);
        this.listTransactionForAddress = this.listTransactionForAddress.bind(this);
    }

    initBlockchain() {
        this.chain = [];
        this.pendingTransactions = [];
        this.confirmedTransactions = [];
        this.currentDifficulty = globalConfigs.initialDifficulty;
        this.cumulativeDifficulty = 0;
        this.addresses = [];
        this.nodes = [];

        this.chain.push(new Block({
            index: 0,
            prevBlockHash: '0',
            previousDifficulty: 0,
            pendingTransactions: this.pendingTransactions,
            nonce: 0,
            minedBy: '00000000000000000000000000000000',
        }));
    }

    getBlockByIndex(req, response) {
        if (!req.params.index || !this.chain[req.params.index]) {
            return response
                .status(404)
                .json({ message: 'Block not found' });
        }
        return response.json(this.chain[req.params.index]);
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
            .json(this.chain);
    }

    getPendingTransactions({ res }) {
        return res
            .status(200)
            .json(this.pendingTransactions);
    }

    getConfirmedTransactions({ res }) {
        return res
            .status(200)
            .json(this.confirmedTransactions);
    }

    addBlockToChain(req) {
        new Block({
            index: this.chain.length,
            prevBlockHash: this.chain[this.chain.length - 1].blockHash,
            previousDifficulty: this.chain[this.chain.length - 1].difficulty,
            pendingTransactions: this.pendingTransactions,
            minedBy: req.params.minerAddress
        });
    }

    getInfo(req, res) {
        return res.json({
            about: globalConfigs.appName,
            nodeId: this.nodeId,
            peers: this.peers,
            chainId: this.chain[0].blockHash,
            nodeUrl: req.protocol + '://' + req.get('host'),
            currentDifficult: this.currentDifficulty,
            blocksCount: this.chain.length,
            cumulativeDifficulty: this.cumulativeDifficulty,
            confirmedTransactions: this.confirmedTransactions.length,
            pendingTransactions: this.pendingTransactions.length,
        });
    }

    debug(req, res) {
        return res.json({
            selfUrl: req.protocol + '://' + req.get('host'),
            nodeId: this.nodeId,
            peers: this.peers,
            transactions: this.confirmedTransactions,
            currentDifficult: this.currentDifficulty,
            blocksCount: this.chain.length,
            cumulativeDifficulty: this.cumulativeDifficulty,
            confirmedTransactions: this.confirmedTransactions.length,
            pendingTransactions: this.pendingTransactions.length,
            chain: {
                blocks: this.chain,
                prevBlockHash: this.chain,
            },
        });
    }

    getAddressesBalances() {
        let addresses = this.addresses;
        let addressesInfo = null;
        if (addresses.length > 0) {
            addressesInfo = addresses.filter(({ confirmedBalance }) => confirmedBalance !== 0)
                .map(({ address, safeBalance }) => {
                    return {
                        [address]: safeBalance
                    };
                });
        }
        if (addressesInfo) {
            return response.send({ addressesBalances: addressesInfo });
        }
        return response.status(400).send({ message: 'No Addresses Found' })
    }

    getTransactionByHash(request, response) {
        const hash = request.params.hash;

        if (!isValidTransactionHash(hash)) {
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

        if (!isValidAddress(from)) {
            return response
                .status(400)
                .json({ message: "Invalid 'from' address" })
        }

        if (!isValidAddress(to)) {
            return response
                .status(400)
                .json({ message: "Invalid 'to' address" })
        }

        if (!isValidPubKey(senderPubKey)) {
            return response
                .status(400)
                .json({ message: "Invalid sender public key" })
        }

        if (!isValidSignature(senderSignature)) {
            return response
                .status(400)
                .json({ message: "Invalid sender signature" })
        }

        this.pendingTransactions.push(Transaction(from, to, value, fee, senderPubKey, data, senderSignature).data)

        return response
            .status(200)
            .json(this.pendingTransactions[this.pendingTransactions.length - 1])
    }

    getAddressesBalances(req, response) {
        let addresses = this.addresses;
        let addressesInfo = null;
        if (addresses.length > 0) {
            addressesInfo = addresses.filter(({ confirmedBalance }) => confirmedBalance !== 0)
                .map(({ address, safeBalance }) => {
                    return {
                        [address]: safeBalance
                    };
                });
        }
        if (addressesInfo) {
            return response.json({ addressesInfo });
        }
        return response.json({})
    }

    listTransactionForAddress({ params: { address } }, response) {
        let transactions = [
            ...this.confirmedTransactions,
            ...this.pendingTransactions
        ].filter((transaction) => transaction.from === address || transaction.to === address);

        if (!transactions) {
            return response.json({});
        }

        return response.json({ address, transactions });
    }

}

module.exports = Blockchain;