const { sha256 } = require('../utils/hashes');

const TRANSACTION_STATUS = {
    'pending': 'pending',
    'confirmed': 'confirmed',
};

function Transaction(_from, _to, _value, _fee, _senderPubKey, _data, _senderSignature) {
    var _dateCreated = new Date().toISOString();
    var _transactionDataHash = null;
    var _trimmedData = _data.trim();

    class SingleTransaction {
        constructor() {
            _transactionDataHash = sha256(JSON.stringify({
                _from,
                _to,
                _value,
                _fee,
                _dateCreated,
                _trimmedData,
                _senderPubKey,
            }));
        }

        get data() {
            return {
                from: _from,
                to: _to,
                value: _value,
                fee: _fee,
                dateCreated: _dateCreated,
                data: _trimmedData,
                senderPubKey: _senderPubKey,
                transactionDataHash: _transactionDataHash,
                senderSignature: _senderSignature,
            }
        }
    }

    return new SingleTransaction();
}

module.exports = Transaction;