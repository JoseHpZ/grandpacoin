const { sha256 } = require('../../utils/hashes');
const BigNumber = require('bignumber.js');
const Validator = require('../../utils/Validator');
const { verifySignature } = require('../../utils/transactionFunctions');
const ripemd160 = require('ripemd160');


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

    static isCoinbase(from) {
        return from === '0000000000000000000000000000000000000000';
    }

    static hashFields(transactions) {
        return transactions.map(tx => {
            const { minedInBlockIndex, transferSuccessful, ...restFields } = tx; // get only the necesary data for the hash
            return restFields;
        });
    }

    static isValidPendingTransaction(transaction) {
        const validator = new Validator(
            Transaction.validationFields(transaction).concat([
                {
                    customValidations: [{
                        validation: () => Transaction.getTransactionDataHash(transaction) === transaction.transactionDataHash,
                        message: 'Transaction data hash invalid'
                    }],
                    name: 'transactionDataHash',
                },
            ]
        ));

        if (!Transaction.isCoinbase(transaction.from)) {
            validator.addRule({
                customValidations: [{
                    validation: () =>  verifySignature(transaction.transactionDataHash, transaction.senderPubKey, transaction.senderSignature),
                    message: 'Invalid signature',
                }],
                name: 'transactionDataHash',
            });
        }
        
        if (validator.validate().hasError()) {
            if (validator.getErrors().errors.fee && Transaction.isCoinbase(transaction.from)) {
                return true;
            }
        }
        return validator.validate().pass();
    }

    static isValid(transaction) {
        const validator = new Validator(
            Transaction.validationFields(transaction).concat([
                {
                    validations: ['required', 'integer'],
                    name: 'minedInBlockIndex',
                    value: transaction.minedInBlockIndex
                },
                {
                    validations: ['required', 'boolean'],
                    name: 'transferSuccessful',
                    value: transaction.transferSuccessful
                },
                {
                    customValidations: [{
                        validation: () => Transaction.getTransactionDataHash(transaction) === transaction.transactionDataHash,
                        message: 'Invalid transaction data hash '
                    }],
                    name: 'transactionDataHash',
                },
            ]
        ));

        if (!Transaction.isCoinbase(transaction.from)) {
            validator.addRule({
                customValidations: [{
                    validation: () => verifySignature(transaction.transactionDataHash, transaction.senderPubKey, transaction.senderSignature),
                    message: 'Invalid signature',
                }],
                name: 'transactionDataHash',
            });
        }

        if (validator.validate().hasError()) {
            if (validator.getErrors().errors.fee && Transaction.isCoinbase(transaction.from)) {
                return true;
            }
        }
        return validator.validate().pass();
    }

    static isValidAddressOfPublicKey(address, publicKeyCompressed) {
        return Transaction.isCoinbase(address) || new ripemd160().update(publicKeyCompressed).digest('hex') === address;
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
                    validation: () => BigNumber(fee).isGreaterThanOrEqualTo(global.minimumTransactionFee),
                    message: 'The minimun transaction fee is: ' + global.minimumTransactionFee,
                }],
                name: 'fee'
            },
            {
                validations: ['isValidAddress'],
                customValidations: [{
                    validation: () => from !== to,
                    message: 'You can\'t sent money to your own account.',
                }],
                names: ['from', 'to'],
                values: { from, to },
            },
            {
                validations: ['isValidPublicKey'],
                customValidations: [{
                    validation: () => Transaction.isValidAddressOfPublicKey(from, senderPubKey),
                }],
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
