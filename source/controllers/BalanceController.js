const blockchain = require("../models/Blockchain");
const Address = require('../models/Address');
const { unprefixedAddress } = require('../../utils/functions');
const Validator = require('../../utils/Validator');


class BalanceController {
    static getAddressesBalances(req, res) {
        const keys = Object.keys(blockchain.addresses);
        const addresses = {};
        if (keys.length > 0) {
            keys.filter(key => blockchain.addresses[key].confirmedBalance !== 0)
                    .forEach(key => {
                        addresses[key] = blockchain.addresses[key].confirmedBalance;
                    })
            return res.json(addresses);
        }
        return res.json({ message: "No addresses found." });
    }

    static getAllBalancesForAddress({ params: { address }, res }) {
        const validator = new Validator([{
            validations: ['isValidAddress'],
            name: 'address',
            value: address,
        }]);
        if (validator.validate().hasError())
            return res.status(400).json(validator.getErrors());

        return res.status(200).json(Address.find(unprefixedAddress(address)).getUserBalances());
    }

    static getAddressTransactions({ params: { address }}, response) {
        const validator = new Validator([{
            validations: ['isValidAddress'],
            name: 'address',
            value: address,
        }]);
        if (validator.validate().hasError())
            return response.status(400).json(validator.getErrors());
        
        let requestAddress = unprefixedAddress(address);
        const transactions = blockchain.getConfirmedTransactions().concat(blockchain.pendingTransactions)
            .filter(singleTransaction => singleTransaction.from === requestAddress || singleTransaction.to === requestAddress)
            .sort((actual, next) => Date.parse(next.dateCreated) - Date.parse(actual.dateCreated));
        return response.json({
            balance: Address.find(requestAddress).getStringBalances(),
            transactions
        });
    }
}

module.exports = BalanceController;
