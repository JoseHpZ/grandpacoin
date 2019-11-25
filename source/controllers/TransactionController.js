const { unprefixedAddress } = require('../../utils/functions');
const { hasFunds, verifySignature } = require('../../utils/transactionFunctions');
const blockchain = require("../models/Blockchain");
const Transaction = require("../models/Transaction");
const BigNumber = require('bignumber.js');
const Validator = require('../../utils/Validator');
const Address = require('../models/Address');
const eventEmmiter = require('../Sockets/eventEmmiter');


class TransactionController {
    static getPendingTransactions({ res }) {
        return res.status(200).json(blockchain.pendingTransactions);
    }

    static getConfirmedTransactions(req, res ) {
        let transactions;
        if (req.query.latest && req.query.latest.toLowerCase() === 'true') {
            transactions = blockchain.getConfirmedTransactions().slice(-3);
        } else {
            transactions = blockchain.getConfirmedTransactions();
        }
        return res.status(200).json(transactions);
    }

    static getAllTransactions({res}) {
        const transactions = blockchain.getConfirmedTransactions().concat(blockchain.pendingTransactions)
            .sort((actual, next) => Date.parse(next.dateCreated) - Date.parse(actual.dateCreated));

        return res.json(transactions)
    }

    static getTransactionByHash({ params: { hash } }, response) {
        const validation = new Validator([{
            validations: ['isValidTransactionHash'],
            name: 'hash',
            value: hash,
        }])
        if (validation.validate().hasError()) {
            return response
                .status(400)
                .json(validation.getErrors());
        }

        const transaction = blockchain.getTransactionByHash(hash);
        if (transaction) return response.status(200).json(transaction);

        return response.status(404).json({ message: "Transaction not found" });
    }

    static sendTransaction({ body }, response) {
        body = typeof body === 'string' ? JSON.parse(body) : body;
        const {
            value,
            fee,
            senderPubKey,
            data,
            senderSignature,
            dateCreated,
        } = body;
        let { from, to } = body;
        const validator = new Validator(Transaction.validationFields(body));
        if (validator.validate().hasError()) {
            return response
                .status(400)
                .json(validator.getErrors());
        }

        from = unprefixedAddress(body.from);
        to = unprefixedAddress(body.to);
        
        const senderAddress = Address.find(from);
        const totalAmount = BigNumber(value).plus(fee);
        if (!senderAddress.hasFunds(totalAmount)) {
            return response
                .status(400)
                .json({
                    message: "Balance is not enough to generate transaction."
                });
        }
        
        const newTransaction = new Transaction({
            from,
            to,
            value,
            fee,
            senderPubKey,
            data,
            senderSignature,
            dateCreated,
        }).getData();
        
        if (blockchain.getTransactionByHash(newTransaction.transactionDataHash)) {
            return response.status(409).send({
                message: 'Transaction already exists.',
            });
        }
        if (!verifySignature(newTransaction.transactionDataHash, senderPubKey, senderSignature)) {
            return response
                .status(400)
                .json({
                    message: "Trasaction signature verification invalid."
                });
        }

        // add new pending transaction
        blockchain.addPendingTransaction(newTransaction);
        // new from pending balance
        senderAddress.pendingToSend(totalAmount);
        // new to pending balance
        Address.find(to).pendingToReceive(value);
        // send transaction to peers
        eventEmmiter.emit('new_transaction', newTransaction);

        return response.json(newTransaction);
    }
}

module.exports = TransactionController;
