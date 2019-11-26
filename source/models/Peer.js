const blockchain = require('./Blockchain');
const Transaction = require('./Transaction');
const Block = require('./Block');
const Address = require('./Address');
const Bignumber = require('bignumber.js');
const eventEmitter = require('../Sockets/eventEmmiter');
const { withColor } = require('../../utils/functions');
const BigNumber = require('bignumber.js');
const { getIPAddress } = require('../Sockets/socketsFunctions');


class Peer {
    static peers = {};

    static addPeer(peerInfo) {
        Peer.peers[peerInfo.peerUrl] = peerInfo;
    }

    static removePeer(peerUrl) {
        if (Peer.peers[peerUrl]) {
            console.log(`\nPeer: ${peerUrl} removed.`)
            delete Peer.peers[peerUrl];
        }
    }

    static getPeer(peerUrl) {
        return Peer.peers[peerUrl];
    }

    static getPeerInfo() {
        return {
            about: global.appName,
            peerUrl: `http://${getIPAddress()}:${global.SERVER_SOCKET_PORT}`,
            cumulativeDifficulty: blockchain.cumulativeDifficulty,
            nodeId: blockchain.nodeId,
        }
    }

    static existsPeer(peerUrl) {
        return Peer.peers.hasOwnProperty(peerUrl);
    }

    static getPeerByUrl(peerUrl) {
       return Object.values(Peer.peers).find(peer => peer.peerUrl !== peerUrl)
    }

    static needSyncronization(cumulativeDifficulty) {
        return BigNumber(cumulativeDifficulty).isGreaterThan(blockchain.cumulativeDifficulty)
    }

    static validateAndSyncronizeChain(chain, socket) {
        let chainLength = chain.length;
        if (chainLength === blockchain.chain.length && blockchain.getLastBlock().blockHash === chain[chainLength - 1].blockHash) {
            return;
        }

        let isValid = true;
        for (let block of chain) {
            if (!Block.isValid(block)) {
                isValid = false;
                break;
            }
        }

        if (!isValid) {
            console.log(withColor('\nThe new chain is invalid.', 'red'));
            return;
        }
        // get pending transactions
        socket.emit(global.CHANNELS.CLIENT_CHANNEL, {
            actionType: global.CHANNELS_ACTIONS.GET_PENDING_TX
        });
        blockchain.chain = chain;
        Address.calculateBlockchainBalances();
        blockchain.calculateCumulativeDifficult();
        blockchain.blockCandidates = {};
        eventEmitter.emit(global.EVENTS.new_chain, chain);
        console.log(withColor('\n<-----Our Chain was replace for a new Chain---->'));
    }

    static addPendingTransactions(pendingTransactions) {
        pendingTransactions.forEach(transaction => {
            Peer.validateTransactionAndGenerateBalances(transaction);
        });
    }

    static addNewTransaction(transaction) {
        if (Peer.validateTransactionAndGenerateBalances(transaction))
            eventEmitter.emit(global.EVENTS.new_transaction, transaction); // emit transaction to client peers
    }

    static validateTransactionAndGenerateBalances(transaction) {
        if (blockchain.getTransactionByHash(transaction.transactionDataHash)) {
            console.log(withColor('Transaction received from peer already exists.', 'yellow'))
            return false;
        }
        if (!Transaction.isValidPendingTransaction(transaction)) {
            console.log(withColor('One peer has send an invalid pending transaction.', 'red'));
            return false;
        }
        
        console.log(withColor('\nAdding new transaction....', 'yellow'))
    
        const senderAddress = Address.find(transaction.from);
        const totalAmount = Bignumber(transaction.value).plus(transaction.fee);
        if (senderAddress.hasFunds(totalAmount)) {
            // add new pending transaction
            blockchain.addPendingTransaction(transaction);
            // new from pending balance
            senderAddress.pendingToSend(totalAmount);
            // new to pending balance
            Address.find(transaction.to).pendingToReceive(transaction.value);
            // order pending transaction
            blockchain.orderPendingTransactions();
            return true;
        }
    }

    static addNewBlock(block, socket) {
        if (!Block.isValid(block)) {
            console.log(withColor('A peer sent an invalid block.', 'red'));
            return;
        }
        let chainLength = blockchain.chain.length;
        if (block.index === chainLength) {
            const transactions = Address.varifyGetAndGenerateBalances(block);
            blockchain.addBlock({ ...block, transactions });
            blockchain.calculateCumulativeDifficult();
            console.log(withColor('\nReceive New block from a peer.', 'yellow'));
            eventEmitter.emit(global.EVENTS.new_block, block); // emit event to Server Socket
        } else if(block.index > chainLength) {
            socket.emit(global.CHANNELS.CLIENT_CHANNEL, {
                actionType: global.CHANNELS_ACTIONS.GET_CHAIN,
            })
        }
    }
}

module.exports = Peer;
