const { sha256 } = require('../../utils/hashes');
const BigNumber = require('bignumber.js');
const { isValidAddress } = require('../../utils/functions');
const Validator = require('../../utils/Validator');

class Transaction {
    constructor({ from, to, value, fee, senderPubKey, data, senderSignature, dateCreated }) {
        this.from = from;
        this.to = to;
        this.value = value;
        this.fee = fee;
        this.dateCreated = dateCreated;
        this.data = data ? data.trim() : null;
        this.senderPubKey = senderPubKey;
        this.senderSignature = senderSignature;
    }

    getData() {
        const { from, to, value, fee, data, dateCreated, senderPubKey, senderSignature } = this;
        return {
            from,
            to,
            value,
            fee,
            dateCreated: dateCreated,
            ...Object.assign({}, data ? { data } : {}),
            senderPubKey,
            transactionDataHash: Transaction.getTransactionDataHash(this),
            senderSignature
        }
    }

    static genesisTransaction() {
        const from = '0000000000000000000000000000000000000000';
        const to = 'a6ef9089840a55ae5934b49e681ca6a60a7ebaec'; // faucet address
        const value = '10000000000000000000';
        const fee = '0';
        const dateCreated = global.originDate;
        const data = 'genesis tx';
        const senderPubKey = '00000000000000000000000000000000000000000000000000000000000000000';
        return {
            from,
            to,
            value,
            fee,
            dateCreated,
            data,
            senderPubKey,
            transactionDataHash: Transaction.getTransactionDataHash({
                from,
                to,
                value,
                fee,
                dateCreated,
                data,
                senderPubKey,
            }),
            senderSignature: [
                '0000000000000000000000000000000000000000000000000000000000000000',
                '0000000000000000000000000000000000000000000000000000000000000000',
            ],
            minedInBlockIndex: 0,
            transferSuccessful: true,
        };
    }


    static getTransactionDataHash({ from, to, value, fee, data, dateCreated, senderPubKey }) {
        return sha256(JSON.stringify({
            from,
            to,
            value,
            fee,
            dateCreated,
            ...Object.assign({}, data ? { data } : {}),
            senderPubKey,
        }))
    }

    static getCoinbaseTransaction({ to, value, data }) {
        const from = '0000000000000000000000000000000000000000',
            senderPubKey = '00000000000000000000000000000000000000000000000000000000000000000',
            senderSignature = [
                '0000000000000000000000000000000000000000000000000000000000000000',
                '0000000000000000000000000000000000000000000000000000000000000000'
            ],
            dateCreated = new Date().toISOString(),
            fee = 0;
        data = data.trim();
        return {
            from,
            to,
            value,
            fee,
            dateCreated: dateCreated,
            data: 'coinbase tx',
            senderPubKey,
            transactionDataHash: Transaction.getTransactionDataHash({
                to,
                value,
                fee,
                data: 'coinbase tx',
                from,
                senderPubKey,
                dateCreated
            }),
            senderSignature,
        }
    }

    static isCoinbase({ from, data }) {
        return from === '0000000000000000000000000000000000000000' && data === 'coinbase tx';
    }

    static isValid(transaction) {
        console.log(transaction)
        const validator = new Validator(
            Transaction.validationFields(transaction).concat([
                {
                    validations: ['nullable', 'integer'],
                    name: 'minedInBlockIndex',
                    value: transaction.minedInBlockIndex
                },
                {
                    validations: ['nullable', 'boolean'],
                    name: 'transferSuccessful',
                    value: transaction.transferSuccessful
                },
                {
                    customValidations: [{
                        validation: () => Transaction.getTransactionDataHash(transaction) === transaction.transactionDataHash
                    }],
                    name: 'transactionDataHash',
                }
            ]
        ))
        if (validator.validate().hasError()) {
            console.log(validator.getErrors())
        }
        return validator.validate().hasError();
    }

    static validationFields({
        data, value, fee, from, to, senderPubKey, senderSignature,
        dateCreated
    }) {
        return [
            {
                validations: ['string'],
                name: 'data',
                value: data,
            },
            {
                validations: ['required', 'string'],
                name: 'value',
                value,
            },
            {
                customValidations: [{
                    validation: () => BigNumber(fee).isGreaterThanOrEqualTo(global.minimumTransactionFee) && !Transaction.isCoinbase({ from, data, }),
                    message: 'The minimun transaction fee is: ' + global.minimumTransactionFee,
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
            {
                validations: ['date'],
                name: 'dateCreated',
                value: dateCreated
            },
        ]
    }
}

module.exports = Transaction;
