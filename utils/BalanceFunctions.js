const Bignumber = require('bignumber.js');

function getAddressBalances(address) {
    if (!address) {
        return {
            safeBalance: 0,
            confirmedBalance: 0,
            pendingBalance: 0,
        }
    }
    return {
        safeBalance: address.safeBalance,
        confirmedBalance: address.confirmedBalance,
        pendingBalance: address.pendingBalance,
    };
}

function getBignumberAddressBalances(address) {
    if (!address) {
        return {
            safeBalance: Bignumber('0'),
            confirmedBalance: Bignumber('0'),
            pendingBalance: Bignumber('0'),
        }
    }
    return {
        safeBalance: Bignumber(address.safeBalance),
        confirmedBalance: Bignumber(address.confirmedBalance),
        pendingBalance: Bignumber(address.pendingBalance),
    };
}

function getNewSenderPendingBalance(balances, amount) {
    return  balances.pendingBalance.isEqualTo('0')
        ? Bignumber(balances.confirmedBalance).minus(amount).toString()
        : Bignumber(balances.pendingBalance).minus(amount).toString();
}

function getNewReceiverPendingBalance(balances, amount) {
    return Bignumber(balances.pendingBalance).plus(amount).toString();
}

module.exports = {
    getAddressBalances,
    getNewSenderPendingBalance,
    getNewReceiverPendingBalance,
    getBignumberAddressBalances,
}