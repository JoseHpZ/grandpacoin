const {
    isValidAddress,
    isValidTransactionHash,
    getAddressBalances,
    isValidPubKey,
    isValidSignature,
} = require("../../utils/functions");
const blockChain = require("../models/Blockchain");
const Transaction = require("../models/Transaction");

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

        const senderAddressBalances = getAddressBalances(from, blockChain.addresses);

        if (senderAddressBalances.message) {
            return response.status(404).json(addressBalance);
        }

        if (senderAddressBalances.safeBalance <= value + fee) {
            return response
                .status(500)
                .json({
                    message: "Balance is not enough to generate transaction"
                });
        }

        blockChain.pendingTransactions.push(
            new Transaction({
                from,
                to,
                value,
                fee,
                senderPubKey,
                data,
                senderSignature: senderSignature[1]
            })
        );

        return response
            .status(200)
            .json(
                this.pendingTransactions[this.pendingTransactions.length - 1]
            );
    }
}

module.exports = TransactionController;
