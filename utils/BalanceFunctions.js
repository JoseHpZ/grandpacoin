const Bignumber = require('bignumber.js');

function getAddressBalances(addressData) {
    if (!addressData) {
        return {
            safeBalance: 0,
            confirmedBalance: 0,
            pendingBalance: 0,
        }
    }
    return {
        safeBalance: addressData.safeBalance,
        confirmedBalance: addressData.confirmedBalance,
        pendingBalance: addressData.pendingBalance,
    };
}

function getBignumberAddressBalances(addressData) {
    if (!addressData) {
        return {
            safeBalance: Bignumber('0'),
            confirmedBalance: Bignumber('0'),
            pendingBalance: Bignumber('0'),
        }
    }
    return {
        safeBalance: Bignumber(addressData.safeBalance),
        confirmedBalance: Bignumber(addressData.confirmedBalance),
        pendingBalance: Bignumber(addressData.pendingBalance),
    };
}

function newSenderPendingBalance(balances, amount) {
    return  balances.pendingBalance.isEqualTo('0')
        ? Bignumber(balances.confirmedBalance).minus(amount).toString()
        : Bignumber(balances.pendingBalance).minus(amount).toString();
}

function newReceiverPendingBalance(balances, amount) {
    return Bignumber(balances.pendingBalance).plus(amount).toString();
}

function rewardBalace(balances, expectedReward) {
    return {
        confirmedBalance: balances.confirmedBalance.plus(expectedReward).toString(),
        safeBalance: balances.safeBalance.toString(),
        pendingBalance:  balances.pendingBalance.toString(),
    }
}

function newSenderBalance(balances, totalAmount) {
    const newSenderSafeBalance = balances.safeBalance.minus(totalAmount);
    return {
        safeBalance: newSenderSafeBalance.isLessThan('0') ? '0' : newSenderSafeBalance.toString(),
        confirmedBalance: balances.confirmedBalance.minus(totalAmount).toString(),
        pendingBalance: balances.pendingBalance.minus(balances.confirmedBalance).toString(),
    }
}

function newReceiverBalance(balances, value) {
    return {
        safeBalance: balances.safeBalance.toString(),
        confirmedBalance: balances.confirmedBalance.plus(value).toString(),
        pendingBalance: balances.pendingBalance.minus(value).toString(),
    }
}

function payFeeOnFailTransaction(balances, fee, value) {
    const newSenderSafeBalance = balances.safeBalance.minus(totalAmount);
    return {
        safeBalance: newSenderSafeBalance.isLessThan('0') ? '0' : newSenderSafeBalance.toString(),
        confirmedBalance: fromBalances.confirmedBalance.minus(transaction.fee).toString(),
        pendingBalance: fromBalances.pendingBalance.minus(totalAmount).toString(),
    }
}

function subtractPendingReceiverBalance() {
    
}

module.exports = {
    getAddressBalances,
    newSenderPendingBalance,
    newReceiverPendingBalance,
    getBignumberAddressBalances,
    rewardBalace,
    newSenderBalance,
    newReceiverBalance,
    payFeeOnFailTransaction,
    subtractPendingReceiverBalance,
}