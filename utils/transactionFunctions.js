const BigNumber = require('bignumber.js');
const ec = new (require('elliptic')).ec('secp256k1');


function removeDuplicateSender(transactions) {
    return transactions.filter((transaction, index, self) =>
        index === self.findIndex((t) => (
            t.from === transaction.from
        ))
    )
}

function clearSingleTransactionData(transaction) {
    if (Object.keys(transaction).includes('data') && transaction.data.trim() === '') {
        delete transaction.data;
    }
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

function getTransactionsFee(transactions) {
    let acumulatedFees = BigNumber(0);
    transactions.forEach(transaction => {
        acumulatedFees = acumulatedFees.plus(transaction.fee)
    });
    return acumulatedFees.toString();
}

/**
 * 
 * @param {array} pendingTransactions
 * filter transaction without funds to pay the transaction fee
 */
function removeTransactionWithoutFunds(pendingTransactions, addresses) {
    return pendingTransactions.filter(transaction => 
        BigNumber(addresses[transaction.from].confirmedBalance)
            .isGreaterThanOrEqualTo(transaction.fee)
    )
}

function removePendingTransactions(pendingTransactions, transactions) {
    let newPendingTransactions = [...pendingTransactions];
    transactions.forEach(transaction => {
        newPendingTransactions = newPendingTransactions.filter((tx) => tx.transactionDataHash !== transaction.transactionDataHash)
    })
    return newPendingTransactions;
}

function compressPublicKey(pubKeyCompressed) {
    const publicKeyCompressed = pubKeyCompressed.replace('0x', '');
    return `${publicKeyCompressed.substr(64, 65) === '0' ? '02' : '03'}${publicKeyCompressed.substr(0, 64)}`
}

function verifySignature (data, publicKey, signature) {
    const keyPair = ec.keyFromPublic(compressPublicKey(publicKey), 'hex');
    return keyPair.verify(data, { r: signature[0], s: signature[1] })
}

module.exports = {
    processBlockTransactions,
    clearSingleTransactionData,
    removeDuplicateSender,
    getTransactionsFee,
    removeTransactionWithoutFunds,
    verifySignature,
    removePendingTransactions,
}