const {
    isValidAddress,
    isValidTransactionHash,
    isValidPubKey,
    isValidSignature,
} = require('../../utils/functions');
const {
    getAddressBalances,
    getNewSenderPendingBalance,
    getNewReceiverPendingBalance,
} = require('../../utils/BalanceFunctions');
const { hasFunds } = require('../../utils/transactionFunctions');
const blockChain = require("../models/Blockchain");
const Transaction = require("../models/Transaction");
const Bignumber = require('bignumber.js');


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
            senderPubKey,
            data,
            senderSignature
        } = request.body;

        if (!value) {
            return response
                .status(400)
                .json({
                    message: 'The value is required',
                })
        }
        if (!value) {
            return response
                .status(400)
                .json({
                    message: 'The value is required',
                })
        }

        if (Bignumber(value).isLessThan(global.mininumTransactionFee)) {
            return response
                .status(400)
                .json({
                    message: 'The minimun transaction fee is: ' + global.mininumTransactionFee,
                })
        }

        let { from, to } = request.body;
        from = isValidAddress(from);
        to = isValidAddress(to);
        
        if (!from) {
            return response
                .status(400)
                .json({ message: "Invalid 'from' address" });
        }

        if (!to) {
            return response
                .status(400)
                .json({ message: "Invalid 'to' address" });
        }

        if (!isValidPubKey(senderPubKey)) {
            return response
                .status(400)
                .json({ message: "Invalid sender public key" });
        }

        if (!isValidSignature(senderSignature)) {
            return response
                .status(400)
                .json({ message: "Invalid sender signature" });
        }

        const senderAddressBalances = getAddressBalances(blockChain.addresses[from]);
        const totalAmount = value + fee;
        if (!hasFunds(senderAddressBalances, totalAmount)) {
            return response
                .status(500)
                .json({
                    message: "Balance is not enough to generate transaction"
                });
        }
        
        const newTransaction = new Transaction({
            from,
            to,
            value,
            fee,
            senderPubKey,
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
