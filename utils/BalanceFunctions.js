const BigNumber = require('bignumber.js');

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
            safeBalance: BigNumber('0'),
            confirmedBalance: BigNumber('0'),
            pendingBalance: BigNumber('0'),
        }
    }
    return {
        safeBalance: BigNumber(address.safeBalance),
        confirmedBalance: BigNumber(address.confirmedBalance),
        pendingBalance: BigNumber(address.pendingBalance),
    };
}

function getNewSenderPendingBalance(from, amount) {
    return {
        ...from,
        pedingBalace: from.pedingBalace === '0'
            ? Bignumber(from.confirmedBalance).minus(amount).toString()
            : Bignumber(from.pedingBalace).minus(amount).toString(),
    }
}

function getNewReceiverPendingBalance(to, amount) {
    return {
        ...to,
        pedingBalace: Bignumber(to.pedingBalace).plus(amount).toString(),
    };
}

module.exports = {
    getAddressBalances,
    getNewSenderPendingBalance,
    getNewReceiverPendingBalance,
    getBignumberAddressBalances,
}