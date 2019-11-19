const BigNumber = require('bignumber.js');
const { getBignumberAddressBalances } = require('./BalanceFunctions')


function removeDuplicateSender(transactions) {
    return transactions.filter((transaction, index, self) =>
        index === self.findIndex((t) => (
            t.from !== transaction.from
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

function hasFunds(balance, amount) {
    return balance.confirmedBalance.isGreaterThanOrEqualTo(amount) && hasPendingBalance(balance, amount);
}

function hasPendingBalance(balance, amount) {
    return balance.pendingBalance.isEqualTo('0') || balance.pendingBalance.isGreaterThan(amount);
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
function removeTransactionWithoutFunds(pendingTransactions) {
    return pendingTransactions.filter(transaction => 
        hasFunds(
            getBignumberAddressBalances(transaction.from),
            BigNumber(transaction.fee)
        )
    )
}

module.exports = {
    processBlockTransactions,
    clearSingleTransactionData,
    removeDuplicateSender,
    hasFunds,
    getTransactionsFee,
    removeTransactionWithoutFunds,
}