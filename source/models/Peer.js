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
        Peer.peers[peerInfo.nodeUrl] = peerInfo;
    }

    static removePeer(nodeUrl) {
        if (Peer.peers[nodeUrl]) {
            console.log(`\nPeer: ${nodeUrl} removed.`)
            delete Peer.peers[nodeUrl];
        }
    }

    static getPeer(nodeUrl) {
        return Peer.peers[nodeUrl];
    }

    static getPeerInfo() {
        return {
            about: global.appName,
            nodeUrl: `http://${getIPAddress()}:${global.PORT}`,
            cumulativeDifficulty: blockchain.cumulativeDifficulty,
            nodeId: blockchain.nodeId,
        }
    }
    
    static getLocalPeerUrl() {
        return `http://${getIPAddress()}:${global.PORT}`;
    }

    static existsPeer(nodeUrl) {
        return Peer.peers.hasOwnProperty(nodeUrl);
    }

    static getPeerByUrl(nodeUrl) {
       return Object.values(Peer.peers).find(peer => peer.nodeUrl !== nodeUrl)
    }

    static needSyncronization(cumulativeDifficulty) {
        return BigNumber(cumulativeDifficulty).isGreaterThan(blockchain.cumulativeDifficulty)
    }

    static validateAndSyncronizeChain(chain, socket) {
        let chainLength = chain.length;
        if (chainLength <= blockchain.chain.length) {
            // console.log('The new chain is equal or shorther than the actual chain..');
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
        if (pendingTransactions.length === 0)
            return;
        pendingTransactions.forEach(transaction => {
            Peer.validateAddTransactionAndGenerateBalances(transaction);
        });
        console.log(withColor('\nNew pending transactions was added....', 'yellow'));
    }

    static addNewTransaction(transaction) {
        if (Peer.validateAddTransactionAndGenerateBalances(transaction))
            eventEmitter.emit(global.EVENTS.new_transaction, transaction); // emit transaction to client peers
        console.log(withColor('\nAdding new pending transaction....', 'yellow'));
    }

    static validateAddTransactionAndGenerateBalances(transaction) {
        if (blockchain.getTransactionByHash(transaction.transactionDataHash)) {
            // console.log(withColor('Transaction received from peer already exists.', 'yellow'))
            return false;
        }
        if (!Transaction.isValidPendingTransaction(transaction)) {
            console.log(withColor('One peer has send an invalid pending transaction.', 'red'));
            return false;
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
            // order pending transaction
            blockchain.orderPendingTransactions();
            return true;
        }
        return false;
    }

    static addNewBlock(block, socket) {
        let chainLength = blockchain.chain.length;
        if (block.index < chainLength)
            return;
        if (!Block.isValid(block)) {
            console.log(withColor('A peer sent an invalid block.', 'red'));
            return;
        }
        if (block.index === chainLength) {
            const transactions = Address.varifyGetAndGenerateBalances(block);
            blockchain.addBlock({ ...block, transactions });
            Address.calculateBlockchainBalances();
            blockchain.calculateCumulativeDifficult();
            console.log(withColor('\nReceive New block from a peer.', 'yellow'));
            eventEmitter.emit(global.EVENTS.new_block, block); // emit event to Server Socket
        } else if(block.index > chainLength) {
            console.log('THE BLOCK INDEX I GREATER THAN OUR CHAIN NEED SYNC')
            socket.emit(global.CHANNELS.CLIENT_CHANNEL, {
                actionType: global.CHANNELS_ACTIONS.GET_CHAIN,
            })
        }
    }
}

module.exports = Peer;
