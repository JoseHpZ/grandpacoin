const net = require("net");
const server = net.createServer();
const blockchain = require('../models/Blockchain');
const Transaction = require('../models/Transaction');
const Block = require('../models/Block');
const Address = require('../models/Address');
const Bignumber = require('bignumber.js');
const eventEmitter = require('./eventEmmiter');


const CHANNELS = {
    NEW_CONNECTION: 'NEW_CONNECTION',
    SINGLE_SOCKET_CHANNEL: 'SINGLE_SOCKET_CHANNEL',
    MULTIPLE_SOCKET_CHANNEL: 'MULTIPLE_SOCKET_CHANNEL',
}

const CHANNELS_ACTIONS = {
    GET_CHAIN: 'GET_CHAIN',
    NEW_CHAIN: 'NEW_CHAIN',
    GET_PENDING_TX: 'GET_PENDING_TX',
    SET_PENDING_TRANSACTIONS: 'SET_PENDING_TRANSACTIONS',
    ADD_NEW_TRANSACTION: 'ADD_NEW_TRANSACTION',
}

function checkPort(port) {
    return new Promise((resolve, reject) => {
        try {
            server.once("error", (err) => {
                reject()
            });
            server.once("listening", () => {
                server.close();
                resolve();
            });
            server.listen(port);
    
        } catch (err) {
            reject(err);
        }
    });
}

function singleSocketActionsHandler(data, socket) {
    if (!data.actionType) return;
    switch (data.actionType) {
        case CHANNELS_ACTIONS.GET_CHAIN:
            socket.emit(CHANNELS.SINGLE_SOCKET_CHANNEL, {
                actionType: CHANNELS_ACTIONS.NEW_CHAIN,
                chain: blockchain.chain,
            })
            break;
        case CHANNELS_ACTIONS.NEW_CHAIN:
            validateAndSyncronizeChain(data.chain);
            break;
        case CHANNELS_ACTIONS.GET_PENDING_TX:
            socket.emit(CHANNELS.SINGLE_SOCKET_CHANNEL, {
                actionType: CHANNELS_ACTIONS.SET_PENDING_TRANSACTIONS,
                pendingTransactions: blockchain.pendingTransactions,
            })
            console.log('Getting pending transactions...')
            break;
        case CHANNELS_ACTIONS.SET_PENDING_TRANSACTIONS:
            addPendingTransactions(data.pendingTransactions);
            break;
        case CHANNELS_ACTIONS.ADD_NEW_TRANSACTION:
            checkNewTransaction(data.transaction)
            break;
        default: return;
    }
}

function validateAndSyncronizeChain(chain) {
    console.log('before set new chain')
    let chainLength = chain.length;
    if (chainLength === blockchain.chain.length && blockchain.getLastBlock().blockHash === chain[chainLength -1 ].blockHash) {
        return;
    }

    let isValid = true;
    for (let block of chain) {
        if (!Block.isValid(block)) {
            isValid = false;
            break;
        }
        for (let transaction of block.transactions) {
            if (!Transaction.isValid(transaction)) {
                isValid = false;
                break;
            }
        }
    }
    if (isValid) {
        blockchain.chain = [...chain];
        Address.calculateBlockchainBalances();
        blockchain.calculateCumulativeDifficult();
        blockchain.blockCandidates = {};
        eventEmitter.emit('new_chain', blockchain.chain);
        console.log(withColor('\n<-----Our Chain was replace for a new Chain---->'));
    } else {
        console.log('The new chain is invalid.')
    }
}

function addPendingTransactions(pendingTransactions) {
    pendingTransactions.forEach(transaction => {
        if (Transaction.isValid(transaction)) 
            blockchain.pendingTransactions.push(transaction);
    });
    blockchain.orderPendingTransactions();
}

function checkNewTransaction(transaction) {
    console.log('Adding new transaction....')
    if (!Transaction.isValid(transaction))
        return;

    if (blockchain.getTransactionByHash(transaction.transactionDataHash)) {
        return;
    }

    const senderAddress = Address.find(transaction.from);
    const totalAmount = Bignumber(transaction.value).plus(transaction.fee);
    if (senderAddress.hasFunds(totalAmount)) {
            // add new pending transaction
        blockchain.addPendingTransaction(transaction);
        // new from pending balance
        senderAddress.pendingToSend(totalAmount);
        // new to pending balance
        Address.find(transaction.to).pendingToReceive(transaction.value);
    }
}


module.exports = {
    checkPort,
    CHANNELS,
    CHANNELS_ACTIONS,
    singleSocketActionsHandler,
}