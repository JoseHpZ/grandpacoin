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
}