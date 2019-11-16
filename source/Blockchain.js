const { generateNodeId, isValidAddress, getAddressBalances, isValidPubKey, isValidSignature } = require('../utils/functions');
const Block = require('./Block');
const globalConfigs = require('../global');
const Transaction = require('./Transaction');
const BigNumber = require('bignumber.js');


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
        this.getAddressesBalances = this.getAddressesBalances.bind(this);
        this.getInfo = this.getInfo.bind(this);
        this.debug = this.debug.bind(this);
        this.getAllBalancesForAddress = this.getAllBalancesForAddress.bind(this);
        this.listTransactionForAddress = this.listTransactionForAddress.bind(this);
        this.getMiningJob = this.getMiningJob.bind(this);
        this.getSubmittedBlock = this.getSubmittedBlock.bind(this);
        this.blockCandidates = {};
        this.testingTransaction = JSON.parse(`{
            "from": "81b7e08f65bdf5648606c89998a9cc8164397647",
            "to": "b47fee9cb74046aac835f472047ee6a3801b5072",
            "value": 2,
            "fee": 5000,
            "dateCreated": "2019-11-09T16:43:50.099Z",
            "data": "hola",
            "senderPubKey": "620e0693630e9156ac33fdc8f1b8139e65473aea7066d8098c732121ab14f9a21",
            "transactionDataHash": "479d1871b3ab10a753ffd1da282c4b04a7798135100915602bdddfdea1f381f7",
            "senderSignature": "620e0693630e9156ac33fdc8f1b8139e65473aea7066d8098c732121ab14f9a2"
        }`);
    }

    initBlockchain() {
        this.chain = [];
        this.confirmedTransactions = [];
        this.confirmedTransactionsData = {}; // to store transactions history
        this.pendingTransactions = [];
        this.currentDifficulty = globalConfigs.initialDifficulty;
        this.addresses = {};
        this.addressesIds = []; 
        this.nodes = [];
        this.peers = [];
        this.nodeId = generateNodeId();
        this.chain.push(Block.getGenesisBlock());
        this.blockNumber = 0;
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
        return res.status(200).json(this.pendingTransactions);
    }

    getConfirmedTransactions({ res }) {
        return res.status(200).json(this.confirmedTransactions);
    }
    getMiningJob(req, res) {
        const address = isValidAddress(req.params.minerAddress);
        if (!address) return res.status(400).json({ message: 'Invalid Address.' });

        const block = Block.getCandidateBlock({
            index: this.chain.length,
            prevBlockHash: this.chain[this.chain.length - 1].blockHash,
            difficulty: this.currentDifficulty,
            transactions: this.pendingTransactions,
            // transactions: [this.testingTransaction, this.testingTransaction],
            minedBy: address
        });
        const { miningJob, ...blockCandidate } = block;
        this.blockCandidates = { ...this.blockCandidates, ...blockCandidate };

        return res.status(200).json(miningJob);
    }
    getSubmittedBlock(req, res) {
        const { blockHash, blockDataHash, ...blockHeader } = req.body;
        const blockCandidate = this.blockCandidates[blockDataHash];

        if (!blockCandidate) return res.status(404).json('Block not found or Block already mined.');

        const newBlock = Block.getBlockObject({
            ...blockCandidate,
            ...blockHeader
        });

        if (newBlock.blockHash === blockHash) {
            this.chain.push(newBlock);
            this.blockCandidates = {};

            return res.status(200).json({'message': 'Block accepted', blockNumber: this.blockNumber += 1})
        } else {
            return res.status(404).json('ASDASD')
        }
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
            cumulativeDifficulty: this.getcumulativeDifficult(),
            confirmedTransactions: this.confirmedTransactions.length,
            pendingTransactions: this.pendingTransactions.length,
        });
    }

    debug(req, res) {
        return res.json({
            selfUrl: req.protocol + '://' + req.get('host'),
            nodeId: this.nodeId,
            coins: globalConfigs.coins,
            peers: this.peers,
            transactions: this.confirmedTransactions,
            currentDifficult: this.currentDifficulty,
            blocksCount: this.chain.length,
            cumulativeDifficulty: this.getcumulativeDifficult(),
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
        const { value, fee, senderPubKey, data, senderSignature } = request.body;
        let { from, to } = request.body;

        from = isValidAddress(from);
        to = isValidAddress(to);

        if (!from) {
            return response
                .status(400)
                .json({ message: "Invalid 'from' address" })
        }

        if (!to) {
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

        const senderAddressBalances = getAddressBalances(from, this.addresses);

        if (senderAddressBalances.message) {
            return response
                .status(404)
                .json(addressBalance)
        }

        if (senderAddressBalances.safeBalance <= (value + fee)) {
            return response
                .status(500)
                .json({ message: "Balance is not enough to generate transaction" });
        }

        this.pendingTransactions.push(new Transaction({
            from,
            to,
            value,
            fee,
            senderPubKey,
            data,
            senderSignature: senderSignature[1]
        }))

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

    getAllBalancesForAddress({ params: { address }, res }) {
        const addressBalance = getAddressBalances(address, this.addresses);

        if (addressBalance.message) {
            return response
                .status(400)
                .json(addressBalance)
        }

        return res
            .status(200)
            .json(addressBalance);
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

    getcumulativeDifficult() {
        console.log('chain: ', this.chain)
        return this.chain.reduce((cumulativeDifficulty, block) => {
            console.log('block: ', block)
            console.log('cumulativeDifficulty: ', cumulativeDifficulty)
            return new BigNumber(16)
                .exponentiatedBy(block.difficulty)
                .plus(cumulativeDifficulty)
                .toString()
        }, "0");
    }

}

module.exports = Blockchain;
