const BigNumber = require('bignumber.js');
const blockchain = require('./Blockchain');

class Address {
    constructor(address, balances = null) {
        if (!balances) {
            this.safeBalance = BigNumber('0');
            this.confirmedBalance = BigNumber('0');
            this.pendingBalance = BigNumber('0');
        } else {
            this.safeBalance = balances.safeBalance;
            this.confirmedBalance = balances.confirmedBalance;
            this.pendingBalance = balances.pendingBalance;
        }
        this.address = address;
    }

    static find(address) {
        let balances = {};
        if (!blockchain.addresses[address]) {
            balances.safeBalance = BigNumber('0');
            balances.confirmedBalance = BigNumber('0');
            balances.pendingBalance = BigNumber('0');
        } else {
            balances.safeBalance = BigNumber(blockchain.addresses[address].safeBalance);
            balances.confirmedBalance = BigNumber(blockchain.addresses[address].confirmedBalance);
            balances.pendingBalance = BigNumber(blockchain.addresses[address].pendingBalance);
        }
        return new Address(address, balances)
    }

    pendingToSend(totalAmount) {
        this.pendingBalance = this.pendingBalance.isZero()
            ? BigNumber(this.confirmedBalance).minus(totalAmount)
            : BigNumber(this.pendingBalance).minus(totalAmount);
        this.updateChain();
    }

    pendingToReceive(amount) {
        if (!this.confirmedBalance.isZero() && this.pendingBalance.isZero())
            this.pendingBalance = this.confirmedBalance.plus(amount);
        else
            this.pendingBalance = this.pendingBalance.plus(amount);
        this.updateChain();
    }

    updateChain() {
        blockchain.setAddressData(this.address, this.getStringBalances());
    }

    getStringBalances() {
        return {
            safeBalance: this.safeBalance.toString(),
            confirmedBalance: this.confirmedBalance.toString(),
            pendingBalance: this.pendingBalance.toString(),
        }
    }

    getUserBalances() {
        return {
            safeBalance: this.safeBalance.isGreaterThan('0') ? this.safeBalance.toString() : '0',
            confirmedBalance: this.confirmedBalance.toString(),
            pendingBalance: this.pendingBalance.toString(),
        }
    }

    hasFunds(amount) {
        if (blockchain.pendingTransactions.find((transaction) => transaction.from === this.address)) {
            return this.confirmedBalance.isGreaterThanOrEqualTo(amount) && this.pendingBalance.isGreaterThanOrEqualTo(amount);
        }
        return this.confirmedBalance.isGreaterThanOrEqualTo(amount);
    }

    hasConfirmedBalance(amount) {
        return this.confirmedBalance.isGreaterThanOrEqualTo(amount);
    }

    send(totalAmount) {
        this.safeBalance = this.safeBalance.minus(totalAmount);
        this.confirmedBalance = this.confirmedBalance.minus(totalAmount)
      
        this.pendingBalance = this.pendingBalance.isEqualTo(this.confirmedBalance)
                ? BigNumber('0')
                : this.pendingBalance;
        console.log('sending')
        console.log('pending balance: ' + this.pendingBalance)
        console.log('confirmedBalance : ' + this.confirmedBalance)
        this.updateChain();
    }

    receive(value) {
        this.confirmedBalance = this.confirmedBalance.plus(value);
        this.pendingBalance = this.confirmedBalance.isEqualTo(this.pendingBalance) ? BigNumber('0') : this.pendingBalance;
        this.updateChain();
    }

    payFeeOnFailTransaction(fee, value) {
        const newSenderSafeBalance = this.safeBalance.minus(fee);
        const newPendingBalance = this.pendingBalance.plus(value);
        this.safeBalance = newSenderSafeBalance.isLessThan('0') ? BigNumber('0') : newSenderSafeBalance;
        this.confirmedBalance = this.confirmedBalance.plus(value);
        this.pendingBalance = newPendingBalance.isEqualTo(this.confirmedBalance) ? BigNumber('0') : newPendingBalance;
        this.updateChain();
    }

    cancelPendingReceived(amount) {
        const newPending = this.pendingBalance.minus(amount);
        this.pendingBalance = newPending.isNegative() ? BigNumber('0') : newPending;
        this.updateChain();
    }
    
    payReward(expectedReward) {
        this.confirmedBalance = this.confirmedBalance.plus(expectedReward);
        if (!this.pendingBalance.isZero()) {
            this.pendingBalance = this.pendingBalance.plus(expectedReward);
        }
        if (this.pendingBalance.isEqualTo(this.confirmedBalance)) {
            this.pendingBalance = BigNumber('0');
        }
        this.updateChain();
    }

    alterSafeBalance(amount) {
        const newSafe = this.safeBalance.plus(amount);
        // if (newSafe.isNegative())
        //     this.safeBalance = BigNumber('0');
        // else
        if (newSafe.isGreaterThan(this.confirmedBalance))
            this.safeBalance = this.confirmedBalance;
        else
            this.safeBalance = newSafe;
            
        this.updateChain();
    }

    static getAddressBalances(address) {
        return {
            safeBalance: BigNumber(blockchain.addresses[address].safeBalance).isGreaterThan('0')
                ? blockchain.addresses[address].safeBalance
                : '0',
            confirmedBalance: blockchain.addresses[address].confirmedBalance,
            pendingBalance: blockchain.addresses[address].pendingBalance,
        };
    }

    static getAddressesBalances() {
        let addresses = {};
        Object.keys(blockchain.addresses).map(address => {
            addresses[address] = Address.getAddressBalances(address);
        })
        return addresses;
    }

    static calculateBlockchainBalances() {
        blockchain.addresses = {};
        blockchain.chain.forEach(block => {
            block.transactions.forEach((transaction) => {
                Address.generateTransactionBalances(transaction);
                if (blockchain.chain.length - transaction.minedInBlockIndex > 5) {
                    Address.find(transaction.to).alterSafeBalance(transaction.value);
                }
            });
        })
        blockchain.pendingTransactions.forEach(transaction => {
            // new to pending balance
            Address.find(transaction.to).pendingToReceive(transaction.value);
            // new from pending balance
            Address.find(transaction.from).pendingToSend(
                BigNumber(transaction.value).plus(transaction.fee) // total amount
            );
        })
    }

    static varifyGetAndGenerateBalances(block) {
        let transactions = [];
        if (block.index > 5) {
            Address.checkSafeBalances(block.index);
        }
        block.transactions.forEach((transaction) => {
            const transferSuccessful = Address.generateTransactionBalances(transaction);
            if (!transaction.minedInBlockIndex) {
                transaction.minedInBlockIndex = block.index;
                transaction.transferSuccessful = transferSuccessful;
            }
            transactions.push({ ...transaction });
        });
        blockchain.filterTransfersPendingTransactions(transactions);
        return transactions;
    }

    static generateTransactionBalances(transaction) {
        let success = true;
        // block reward transaction coinbase
        if (transaction.from === '0000000000000000000000000000000000000000') {
            Address.find(transaction.to).payReward(transaction.value);
            return success;
        }
        const totalAmount = BigNumber(transaction.value).plus(transaction.fee);
        const fromAddress = Address.find(transaction.from);
        const toAddress = Address.find(transaction.to);
        if (fromAddress.hasFunds(totalAmount)) {
            fromAddress.send(totalAmount);
            toAddress.receive(transaction.value);
        } else {
            success = false;
            fromAddress.payFeeOnFailTransaction(transaction.fee, transaction.value)
            toAddress.cancelPendingReceived(transaction.value);
        }
        return success;
    }

    static getTransactionsStatuses(block) {
        let transactions = [];
        block.transactions.forEach((transaction) => {
            const fromAddress = Address.find(transaction.from);
            if (fromAddress.hasFunds(BigNumber(transaction.value).plus(transaction.fee))) {
                transactions.push({
                    ...transaction,
                    minedInBlockIndex: block.index,
                    transferSuccessful: true,
                });
            } else {
                transactions.push({
                    ...transaction,
                    minedInBlockIndex: block.index,
                    transferSuccessful: false,
                });
            }
        });
        blockchain.filterTransfersPendingTransactions(transactions);
        return transactions;
    }

    static checkSafeBalances(blockIndex) {
        // console.clear()
        // console.log('******************************************')
        blockchain.chain[blockIndex - 6].transactions.forEach((transaction) => {
             Address.find(transaction.to).alterSafeBalance(transaction.value);
        });
    }
   
}

module.exports = Address;