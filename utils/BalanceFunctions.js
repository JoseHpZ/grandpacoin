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

module.exports = {
    getAddressBalances,
    newSenderPendingBalance,
    newReceiverPendingBalance,
    getBignumberAddressBalances,
}