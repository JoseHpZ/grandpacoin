const crypto = require('crypto');
const uuidv4 = require('uuid/v4');
const ip = require('ip');
const BigNumber = require('bignumber.js');

function generateNodeId() {
    return crypto
        .createHash('sha256')
        .update((new Date()).toISOString() + uuidv4())
        .digest('hex');
}

function isValidAddress(address) {
    if (!address)
        return false;
    const unprefixedAddress = address.replace(/^0x/, '');
    if (/^([A-Fa-f0-9]{40})$/.test(unprefixedAddress))
        return unprefixedAddress;
    else
        return false;
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

function getTransactionsFee(transactions) {
    let acumulatedFees = BigNumber(0);
    transactions.forEach(transaction => {
        acumulatedFees = acumulatedFees.plus(transaction.fee)
    });
    return acumulatedFees.toString();
}

function getNodeOwnIp() {
    const port = process.env.PORT || 5555;
    const host = ip.address();
    return {
        peerUrl: `http://${host}:${port}`,
        host,
        port
    };
}


module.exports = {
    generateNodeId,
    isValidAddress,
    isValidPubKey,
    isValidSignature,
    isValidTransactionHash,
    getTransactionsFee,
    getNodeOwnIp,
}
