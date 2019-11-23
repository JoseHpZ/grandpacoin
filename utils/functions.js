const crypto = require('crypto');
const uuidv4 = require('uuid/v4');

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

function withColor(text = '', color = 'green') {
    const newColor = () => {
        switch (color) {
            case 'yellow':
                return '\x1b[33m';
            case 'cyan':
                return '\x1b[36m';
            case 'red':
                return '\x1b[31m';
            default:
            return '\x1b[32m';
        }
    }
    return newColor() + text + ' ' + '\x1b[0m';
}

module.exports = {
    generateNodeId,
    isValidAddress,
    isValidPubKey,
    isValidSignature,
    isValidTransactionHash,
    isValidUrl,
    unprefixedAddress,
    withColor,
}
