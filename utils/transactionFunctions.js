const BigNumber = require('bignumber.js');

function filterValidTransactions(transactions, addresses) {
    return transactions.filter(transaction =>
        addresses[transactions.from].safeBalance >= (transaction.value + transaction.fee)
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

function hasFunds(balance, amount) {
    return balance.confirmedBalance.isGreaterThan(amount) && hasPendingBalance(balance, amount);
}

function hasPendingBalance(balance, amount) {
    return !balance.pendingBalance.isEqualTo('0') && balance.pendingBalance.isGreaterThan(amount);
}

function getTransactionsFee(transactions) {
    let acumulatedFees = BigNumber(0);
    transactions.forEach(transaction => {
        acumulatedFees = acumulatedFees.plus(transaction.fee)
    });
    return acumulatedFees.toString();
}

module.exports = {
    processBlockTransactions,
    clearSingleTransactionData,
    filterValidTransactions,
    hasFunds,
    getTransactionsFee,
}