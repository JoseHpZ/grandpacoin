const { getAddressBalances } = require('../../utils/BalanceFunctions');
const blockChain = require("../models/Blockchain");
const { isValidAddress } = require('../../utils/functions');

class BalanceController {
    static getAddressesBalances(req, res) {
        let confirmedBalances = {};

        Object.keys(blockChain.addresses).forEach(key => {
            if (blockChain.addresses[key].confirmedBalance > 0) {
                confirmedBalances = { ...confirmedBalances, ...{ [key]: blockChain.addresses[key].confirmedBalance } }
            }
        })

        return res.status(200).send(confirmedBalances);
    }

    static getAllBalancesForAddress({ params: { address }, res }) {
        if (!isValidAddress(address))
            return response.status(400).json({ message: 'Invalid address.' });

        const addressBalance = getAddressBalances(blockChain.addresses[address]);

        if (!addressBalance) {
            return response.status(400).json({ message: 'Invalid address, or does not exists.' });
        }

        return res.status(200).json(addressBalance);
    }

    static listTransactionForAddress({ params: { address } }, response) {
        let transactions = [
            ...blockChain.getConfirmedTransactions(),
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
