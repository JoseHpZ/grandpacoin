const blockchain = require("../models/Blockchain");
const Address = require('../models/Address');
const { isValidAddress } = require('../../utils/functions');


class BalanceController {
    static getAddressesBalances(req, res) {
        if (blockchain.addresses.length > 0) {
            return res.json(
                blockchain.addresses
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

    static getAddressTransactions({ params: { address }}, response) {
        const transactions = blockchain.getConfirmedTransactions().concat(blockchain.pendingTransactions)
            .filter(singleTransaction => singleTransaction.from === address || singleTransaction.to === address)
            .sort((actual, next) => Date.parse(next.dateCreated) - Date.parse(actual.dateCreated));
        return response.json({
            balance: Address.find(address).getStringBalances(),
            transactions
        });
    }
}

module.exports = BalanceController;
