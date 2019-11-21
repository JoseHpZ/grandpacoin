// const blockChain = require("../models/Blockchain");
const Address = require('../models/Address');
const { isValidAddress } = require('../../utils/functions');


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
        if (!isValidAddress(address))
            return response.status(400).json({ message: 'Invalid address.' });
        return res.status(200).json(new Address(address).getStringBalances());
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
