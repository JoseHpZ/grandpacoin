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

function unprefixedAddress(address) {
    return  address.replace(/^0x/, '');
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

function isValidUrl(url) {
    if (!url) return false;

    if (/^(http|https)\:\/\/[a-z0-9\.-]+\.[a-z]{2,4}(\:[0-9]{1,4})?/gi.test(url)
        || /^(http|https)\:\/\/[a-z0-9\.-]+(\:[0-9]{1,4})?/gi.test(url)
        || /^(http|https)\:\/\/[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+(\:[0-9]{1,4})?/gi.test(url)) {
        return true;
    }
    return false;
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
    getNodeOwnIp,
    isValidUrl,
    unprefixedAddress,
}
