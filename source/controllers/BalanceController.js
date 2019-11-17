const { getAddressBalances } = require("../../utils/functions");
const blockChain = require("../models/Blockchain");

class BalanceController {
    static getAddressesBalances(req, res) {
        if (blockChain.addresses.length > 0) {
            return res.json(
                blockChain.addresses
                    .filter(({ confirmedBalance }) => confirmedBalance !== 0)
                    .map(({ address, safeBalance }) => ({ [address]: safeBalance} ))
            );
        }
        return res.json({ message: "No addresses found." });
    }

    static getAllBalancesForAddress({ params: { address }, res }) {
        const addressBalance = getAddressBalances(
            address,
            blockChain.addresses
        );

        if (addressBalance.message) {
            return response.status(400).json(addressBalance);
        }

        return res.status(200).json(addressBalance);
    }

    static listTransactionForAddress({ params: { address } }, response) {
        let transactions = [
            ...blockChain.confirmedTransactions,
            ...blockChain.pendingTransactions
        ].filter(
            transaction =>
                transaction.from === address || transaction.to === address
        );

        if (!transactions) {
            return response.json({});
        }

        return response.json({ address, transactions });
    }
}

module.exports = BalanceController;
