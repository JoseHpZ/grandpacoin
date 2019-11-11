const { sha256 } = require('../utils/hashes');

const TRANSACTION_STATUS = {
    'pending': 'pending',
    'confirmed': 'confirmed',
};

function Transaction({ from, to, value, fee, senderPubKey, data, senderSignature }) {
    let dateCreated = new Date().toISOString();

    class SingleTransaction {
        constructor() {
            this.from = from;
            this.to = to;
            this.value = value;
            this.fee = fee;
            this.senderPubKey = senderPubKey;
            this.data = data.trim();
            this.senderSignature = senderSignature;

            this.getTransactionDataHash = this.getTransactionDataHash.bind(this);
        }

        getData() {
            const { from, to, value, fee, data, senderPubKey } = this;

            return {
                from,
                to,
                value,
                fee,
                dateCreated,
                ...Object.assign({}, data ? { data } : {}),
                senderPubKey,
                transactionDataHash: this.getTransactionDataHash(),
                senderSignature
            }
        }

        getTransactionDataHash({ from, to, value, fee, data, senderPubKey } = this) {
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
    }

    return new SingleTransaction().getData();
}

module.exports = Transaction;