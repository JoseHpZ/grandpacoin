const { sha256 } = require('../../utils/hashes');
const BigNumber = require('bignumber.js');


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
            ...Object.assign({}, data ? { data } : {}),
            senderPubKey,
            transactionDataHash: Transaction.getTransactionDataHash({
                to,
                value,
                fee,
                ...Object.assign({}, data ? { data } : {}),
                from,
                senderPubKey,
                dateCreated
            }),
            senderSignature,
        }
    }
}

module.exports = Transaction;
