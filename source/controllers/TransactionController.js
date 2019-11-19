const {
    getBignumberAddressBalances,
    getNewSenderPendingBalance,
    getNewReceiverPendingBalance,
} = require('../../utils/BalanceFunctions');
const { unprefixedAddress } = require('../../utils/functions');
const { hasFunds } = require('../../utils/transactionFunctions');
const blockChain = require("../models/Blockchain");
const Transaction = require("../models/Transaction");
const Bignumber = require('bignumber.js');
const Validator = require('../../utils/Validator');


class TransactionController {
    static getPendingTransactions({ res }) {
        return res.status(200).json(blockChain.pendingTransactions);
    }

    static getConfirmedTransactions({ res }) {
        return res.status(200).json(blockChain.confirmedTransactions);
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

        const transaction = blockChain.getTransactionByHash(hash);
        if (transaction) return response.status(200).json(transaction);

        return response.status(404).json({ message: "Transaction not found" });
    }

    static sendTransaction({ body }, response) {
        const {
            value,
            fee,
            senderPubKey,
            data,
            senderSignature,
        } = body;
        let from = unprefixedAddress(body.from);
        let to = unprefixedAddress(body.to);
        const validator = new Validator([
            {
                validations: ['string'],
                name: 'data',
                value: data,
            },
            {
                validations: ['required','string'],
                name: 'value',
                value,
            },
            {
                customValidations: [{
                    validation: () => Bignumber(fee).isGreaterThanOrEqualTo(global.mininumTransactionFee),
                    message: 'The minimun transaction fee is: ' + global.mininumTransactionFee,
                }],
                name: 'fee',
                value: fee,
            },
            {
                validations: ['isValidAddress'],
                customValidations: [{
                    validation: () => from !== to,
                    message: 'You can\'t sent money to you own account',
                }],
                names: ['from', 'to'],
                values: { from, to },
            },
            {
                validations: ['isValidPublicKey'],
                name: 'senderPubKey',
                value: senderPubKey
            },
            {
                validations: ['isValidSignature'],
                name: 'senderSignature',
                value: senderSignature
            },
        ]);

        if (validator.validate().hasError()) {
            return response
                .status(400)
                .json(validator.getErrors());
        }

        const senderAddressBalances = getBignumberAddressBalances(blockChain.addresses[from]);
        const totalAmount = Bignumber(value).plus(fee);
        if (!hasFunds(senderAddressBalances, totalAmount)) {
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
            senderSignature: senderSignature,
        }).getData();
        blockChain.addPendingTransaction(newTransaction);
        // new from pending balance
        blockChain.addresses[from] = {
            ...blockChain.addresses[from],
            pendingBalance: getNewSenderPendingBalance(senderAddressBalances, totalAmount),
        };
        // new to pending balance
        const receiverAddressBalances = getBignumberAddressBalances(blockChain.addresses[to]);
        blockChain.addresses[to] = {
            ...blockChain.addresses[to],
            pendingBalance: getNewReceiverPendingBalance(receiverAddressBalances, totalAmount),
        };
        return response.json(newTransaction);
    }
}

module.exports = TransactionController;
