const crypto = require('crypto');
const uuidv4 = require('uuid/v4');

function generateNodeId() {
    return crypto
        .createHash('sha256')
        .update((new Date()).toISOString() + uuidv4())
        .digest('hex');
}

function isValidAddress(address) {
    return /^([A-Fa-f0-9]{40})$/.test(address);
}

function isValidPubKey(pubKey) {
    return /^([A-Fa-f0-9]{65})$/.test(pubKey);
}

function isValidSignature(signature) {
    return /^([A-Fa-f0-9]{64})$/.test(signature);
}

function isValidTransactionHash(transaction) {
    return /^([A-Fa-f0-9]{64})$/.test(transaction);
}

module.exports = {
    generateNodeId,
    isValidAddress,
    isValidPubKey,
    isValidSignature,
    isValidTransactionHash
}