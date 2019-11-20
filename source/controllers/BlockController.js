const { unprefixedAddress } = require('../../utils/functions');
const { removeDuplicateSender, hasFunds } = require('../../utils/transactionFunctions');
const Validator = require('../../utils/Validator');
const blockchain = require('../models/Blockchain');
const Block = require('../models/Block');
const { getBignumberAddressBalances } = require('../../utils/BalanceFunctions');
const BigNumber = require('bignumber.js');


class BlockController {
    static getMiningJob({ params: { minerAddress }}, res) {
        const validator = new Validator([{
            validations: ['isValidAddress'],
            name: 'minerAddress',
            value: minerAddress,
        }])
        if (validator.validate().hasError())
            return res.status(400).json({ message: 'Invalid block or already mined.' });

        blockchain.removeInvalidPendingTransactions();
        const block = Block.getCandidateBlock({
            index: blockchain.chain.length,
            prevBlockHash: blockchain.chain[blockchain.chain.length - 1].blockHash,
            difficulty: blockchain.currentDifficulty,
            transactions: removeDuplicateSender(blockchain.pendingTransactions),
            minedBy: unprefixedAddress(minerAddress)
        });
        const { miningJob, ...blockCandidate } = block;
        blockchain.storeBlockCandidate(blockCandidate);
        return res.status(200).json(miningJob);
    }

    static getSubmittedBlock({ body }, res) {
        const { blockHash, blockDataHash, ...blockHeader } = body;
        if (blockHash.length !== 64 || blockDataHash.length !== 64)
            return res.status(400).json({message: 'Invalid data.'});
        
        const blockCandidate = blockchain.getBlockCandidate(blockDataHash);
        if (!blockCandidate)
            return res.status(404).json({message: 'Block not found or Block already mined.'});

        const newBlock = Block.getBlockObject({
            ...blockCandidate,
            ...blockHeader
        });

        if (newBlock.blockHash === blockHash && (newBlock.index === blockchain.getLastBlock().index + 1)) {
            let transactions = [];
            newBlock.transactions.forEach((transaction, index) => {
                // block reward transaction
                if (index === 0) {
                    const minerBalances = getBignumberAddressBalances(
                        blockchain.getAddressData(newBlock.minedBy)
                    );
                    console.log('minerBalances: ', minerBalances)
                    blockchain.setAddressData(newBlock.minedBy, {
                        ...blockchain.getAddressData(transaction.from),
                        confirmedBalance: minerBalances.confirmedBalance.plus(blockCandidate.expectedReward).toString(),
                        safeBalance: minerBalances.safeBalance.toString(),
                        pendingBalance:  minerBalances.pendingBalance.toString(),
                    });
                    transactions.push({
                        ...transactions,
                        minedInBlockIndex: newBlock.index,
                        transactionSuccessful: true,
                    });
                    return;
                }
                const totalAmount = BigNumber(transaction.value).plus(transaction.fee);
                const fromBalances = getBignumberAddressBalances(
                    blockchain.getAddressData(transaction.from)
                );
                let success = false;
                if (hasFunds(fromBalances, totalAmount)) {
                    success = true;
                    // subtract the pending balance and confirm balance of the sender
                    const newSenderSafeBalance = fromBalances.safeBalance.minus(totalAmount);
                    blockchain.setAddressData(transaction.from, {
                        ...blockchain.getAddressData(transaction.from),
                        safeBalance: newSenderSafeBalance.isLessThan('0') ? '0' : newSenderSafeBalance.toString(),
                        confirmedBalance: fromBalances.confirmedBalance.minus(totalAmount).toString(),
                        pendingBalance: fromBalances.pendingBalance.minus(fromBalances.confirmedBalance).toString(),
                    });
                    const toBalances = getBignumberAddressBalances(blockchain.getAddressData(transaction.to));
                    blockchain.setAddressData(transaction.to, {
                        ...blockchain.getAddressData(transaction.to),
                        pendingBalance: toBalances.pendingBalance.minus(transaction.value).toString(),
                        confirmedBalance: toBalances.confirmedBalance.plus(transaction.value).toString(),
                    });
                  
                } else {
                    // only paid the fee
                    blockchain.setAddressData(transaction.from, {
                        ...blockchain.getAddressData(from),
                        pendingBalance: fromBalances.pendingBalance.minus(totalAmount).toString(),
                        confirmedBalance: fromBalances.confirmedBalance.minus(transaction.fee).toString(),
                    });
                    // subtract the pending balance
                    const toBalances = getBignumberAddressBalances(transaction.to);
                    blockchain.setAddressData(transaction.to, {
                        ...blockchain.getAddressData(to),
                        pendingBalance: toBalances.pendingBalance.minus(transaction.value).toString(),
                    });
                }
                transactions.push({
                    ...transaction,
                    minedInBlockIndex: newBlock.index,
                    transferSuccessful: success,
                })
            });
            blockchain.addBlock({ ...newBlock, transactions });
            return res.status(200).json({
                message: 'Block accepted reward paid: ' + blockCandidate.expectedReward + ' Grandson.'
            });
        }
        
        return res.status(404).json({message: 'Block not found or Block already mined.'});
    }

    static getBlocks({ res }) {
        return res
            .status(200)
            .json(blockchain.chain);
    }

    static getBlockByIndex(req, response) {
        if (!req.params.index || !blockchain.chain[req.params.index]) {
            return response
                .status(404)
                .json({ message: 'Block not found' });
        }
        return response.json(blockchain.chain[req.params.index]);
    }
}

module.exports = BlockController;
