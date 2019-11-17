const { sha256 } = require('../../utils/hashes');

const TRANSACTION_STATUS = {
    'pending': 'pending',
    'confirmed': 'confirmed',
};

class Transaction {
    constructor({ from, to, value, fee, senderPubKey, data, senderSignature, minedInBlockIndex }) {
        this.from = from;
        this.to = to;
        this.value = value;
        this.fee = fee;
        this.senderPubKey = senderPubKey;
        this.data = data.trim();
        this.senderSignature = senderSignature;
        this.dateCreated = new Date().toISOString();
        this.minedInBlockIndex = minedInBlockIndex;

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

    static getCoinbaseTransaction({ to, value, data, minedInBlockIndex }) {
        const from = '0000000000000000000000000000000000000000',
            senderPubKey = '00000000000000000000000000000000000000000000000000000000000000000',
            senderSignature = [
                '0000000000000000000000000000000000000000000000000000000000000000',
                '0000000000000000000000000000000000000000000000000000000000000000'
            ],
            dateCreated = new Date().toISOString(),
            fee = 0;

        return {
            from,
            to,
            value,
            fee,
            dateCreated: dateCreated,
            ...Object.assign({}, data ? { data: data.trim() } : {}),
            senderPubKey,
            transactionDataHash: Transaction.getTransactionDataHash({
                to, value, fee, data: data.trim(), minedInBlockIndex, from, senderPubKey, senderSignature, dateCreated
            }),
            senderSignature,
            minedInBlockIndex
        }
    }
}

module.exports = Transaction;