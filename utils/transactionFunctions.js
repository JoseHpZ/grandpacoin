const BigNumber = require('bignumber.js');
const { getBignumberAddressBalances } = require('./BalanceFunctions')
const ec = new (require('elliptic')).ec('secp256k1');
const {
    rewardBalace, newSenderBalance,
    newReceiverBalance, payFeeOnFailTransaction,
    subtractPendingReceiverBalance,
} = require('./BalanceFunctions');


function removeDuplicateSender(transactions) {
    return transactions.filter((transaction, index, self) =>
        index !== self.findIndex((t) => (
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
function removeTransactionWithoutFunds(pendingTransactions, addresses) {
    return pendingTransactions.filter(transaction => 
        getBignumberAddressBalances(
            addresses[transaction.from]
        ).confirmedBalance.isGreaterThanOrEqualTo(transaction.fee)
    )
}

function compressPublicKey(pubKeyCompressed) {
    const publicKeyCompressed = pubKeyCompressed.replace('0x', '');
    return `${publicKeyCompressed.substr(64, 65) === '0' ? '02' : '03'}${publicKeyCompressed.substr(0, 64)}`
}

function verifySignature (data, publicKey, signature) {
    const keyPair = ec.keyFromPublic(compressPublicKey(publicKey), 'hex');
    return keyPair.verify(data, { r: signature[0], s: signature[1] })
}

function varifyAndGenerateBalances(blockCandidate, newBlock, blockchain) {
    let transactions = [];
    newBlock.transactions.forEach((transaction, index) => {
        // block reward transaction
        if (index === 0) {
            const minerBalances = getBignumberAddressBalances(
                blockchain.getAddressData(newBlock.minedBy)
            );
            console.log('minerBalances: ', minerBalances)
            blockchain.setAddressData(
                newBlock.minedBy,
                rewardBalace(minerBalances, blockCandidate.expectedReward)
            );
            transactions.push({
                ...transaction,
                minedInBlockIndex: newBlock.index,
                transferSuccessful: true,
            });
            return;
        }
        const totalAmount = BigNumber(transaction.value).plus(transaction.fee);
        const fromBalances = getBignumberAddressBalances(
            blockchain.getAddressData(transaction.from)
        );
        const toBalances = getBignumberAddressBalances(
            blockchain.getAddressData(transaction.to)
        );
        let success = false;
        if (hasFunds(fromBalances, totalAmount)) {
            success = true;
            blockchain.setAddressData(transaction.from, newSenderBalance(fromBalances, totalAmount));
            blockchain.setAddressData(transaction.to, newReceiverBalance(toBalances, transaction.value));
        } else {
            blockchain.setAddressData(transaction.from, payFeeOnFailTransaction(fromBalances, fee, value));
            blockchain.setAddressData(transaction.to, subtractPendingReceiverBalance(toBalances, value));
        }
        transactions.push({
            ...transaction,
            minedInBlockIndex: newBlock.index,
            transferSuccessful: success,
        })
    });
}

module.exports = {
    processBlockTransactions,
    clearSingleTransactionData,
    removeDuplicateSender,
    hasFunds,
    getTransactionsFee,
    removeTransactionWithoutFunds,
    verifySignature,
    varifyAndGenerateBalances,
}