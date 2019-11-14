const crypto = require('crypto');
const uuidv4 = require('uuid/v4');

function generateNodeId() {
    return crypto
        .createHash('sha256')
        .update((new Date()).toISOString() + uuidv4())
        .digest('hex');
}

function isValidAddress(address) {
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

function getAddressBalances(address, addresses) {
    if (!isValidAddress(address)) {
        return { message: 'Invalid address, or does not exists.' };
    }
    if (!addresses[address]) {
        return {
            safeBalance: 0,
            confirmedBalance: 0,
            pendingBalance: 0,
        }
    }
    return {
        safeBalance: addresses[address].safeBalance,
        confirmedBalance: addresses[address].confirmedBalance,
        pendingBalance: addresses[address].pendingBalance,
    };
}

function processBlockTransactions(transactions) {
    let acumulatedFees = 0;
    transactions.forEach(transaction => {
        clearSingleTransactionData(transaction);
        acumulatedFees += transaction.fee
    });
    return {
        transactions,
        acumulatedFees
    };
}

function clearSingleTransactionData(transaction) {
    if (Object.keys(transaction).includes('data') && transaction.data.trim() === '') {
        delete transaction.data;
    }
}

module.exports = {
    generateNodeId,
    isValidAddress,
    isValidPubKey,
    isValidSignature,
    isValidTransactionHash,
    getAddressBalances,
    processBlockTransactions,
    clearSingleTransactionData
}
