const {
    isValidAddress,
    isValidTransactionHash,
    isValidPubKey,
    isValidSignature,
} = require('../../utils/functions');
const {
    getBignumberAddressBalances,
    getNewSenderPendingBalance,
    getNewReceiverPendingBalance,
} = require('../../utils/BalanceFunctions');
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
        if (!isValidTransactionHash(hash)) {
            return response
                .status(400)
                .json({ message: "Invalid transaction hash" });
        }

        const transaction = blockChain.getTransactionByHash(hash);
        if (transaction) return response.status(200).json(transaction);

        return response.status(404).json({ message: "Transaction not found" });
    }

    static sendTransaction(request, response) {
        const {
            value,
            fee,
            senderPublicKey,
            data,
            senderSignature,
            from,
            to,
        } = request.body;
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
                names: ['from', 'to'],
                values: { from, to },
            },
            {
                validations: ['isValidPublicKey'],
                name: 'senderPublicKey',
                value: senderPublicKey
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
                    message: "Balance is not enough to generate transaction"
                });
        }
        
        const newTransaction = new Transaction({
            from,
            to,
            value,
            fee,
            senderPublicKey,
            data,
            senderSignature: senderSignature[1]
        });

        blockChain.pendingTransactions.push(newTransaction);
        // new from pending balance
        blockChain.addresses[from] = getNewSenderPendingBalance(from, totalAmount);
        // new to pending balance
        blockChain.addresses[to] = getNewReceiverPendingBalance(to, totalAmount);
        return response.json(newTransaction);
    }
}

module.exports = TransactionController;
