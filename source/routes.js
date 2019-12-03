const BlockchainController = require('./controllers/BlockchainController');
const BlockController = require('./controllers/BlockController');
const TransactionController = require('./controllers/TransactionController');
const BalanceController = require('./controllers/BalanceController');
const PeersController = require('./controllers/PeersController');


module.exports = (router) => {
    // Blockchain debug
    router.get('/info', BlockchainController.getInfo);
    router.get('/debug', BlockchainController.getDebug);
    router.get('/debug/reset-chain', BlockchainController.resetChain);
    router.get('/debug/mine/:minerAddress/:difficulty', BlockchainController.debugMining);

    // Transaction routes
    router.get('/transactions/pending', TransactionController.getPendingTransactions);
    router.get('/transactions/confirmed', TransactionController.getConfirmedTransactions);
    router.get('/transaction/:hash', TransactionController.getTransactionByHash);
    router.post('/transactions/send', TransactionController.sendTransaction);
    router.get('/transactions', TransactionController.getAllTransactions);
    // balances
    router.get('/balances', BalanceController.getAddressesBalances);
    router.get('/address/:address/transactions', BalanceController.getAddressTransactions);
    router.get('/address/:address/balance', BalanceController.getAllBalancesForAddress);
    // blocks
    router.get('/mining/get-mining-job/:minerAddress', BlockController.getMiningJob);
    router.post('/mining/submit-mined-block', BlockController.getSubmittedBlock);
    router.get('/blocks', BlockController.getBlocks);
    router.get('/blocks/:index', BlockController.getBlockByIndex);
    router.get('/block/:hash', BlockController.getBlockByHash);
    // Peers routes
    router.get('/peers', PeersController.getConnectedPeers);
    router.post('/peers/connect', PeersController.connectPeer);
    router.post('/peers/notify-new-block', PeersController.notifyNewBlock);
    router.delete('/peers/delete', PeersController.deletePeer);

    // Default route
    router.all('*', function (req, res) {
        res.status(404).json({ message: 'This route does not exists.' })
    })
}
