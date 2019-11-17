const BlockchainController = require('./controllers/BlockchainController');
const BlockController = require('./controllers/BlockController');
const TransactionController = require('./controllers/TransactionController');
const BalanceController = require('./controllers/BalanceController');


module.exports = (router) => {
    // Blockchain debug
    router.get('/info', BlockchainController.getInfo);
    router.get('/debug', BlockchainController.getDebug);
    router.get('/debug/reset-chain', BlockchainController.resetChain);
    // router.get('/debug/mine/:minerAddress/:difficulty', function (req, res) {
    // });

    // // Transaction routes
    router.get('/transactions/pending', TransactionController.getPendingTransactions);
    router.get('/transactions/confirmed', TransactionController.getConfirmedTransactions);
    router.get('/transaction/:hash', TransactionController.getTransactionByHash);
    router.post('/transactions/send', TransactionController.sendTransaction);
    // balances
    router.get('/balances', BalanceController.getAddressesBalances);
    router.get('/address/:address/transactions', BalanceController.listTransactionForAddress);
    router.get('/address/:address/balance', BalanceController.getAllBalancesForAddress);
    // blocks
    router.get('/mining/get-mining-job/:minerAddress', BlockController.getMiningJob);
    router.post('/mining/submit-mined-block', BlockController.getSubmittedBlock);
    router.get('/blocks', BlockController.getBlocks);
    router.get('/blocks/:index', BlockController.getBlockByIndex);
    // // Peers routes
    // router.get('/peers', function (req, res) {
    // })
    // router.post('/peers/connect', function (req, res) {
    // })
    // router.post('/peers/notify-new-block', function (req, res) {
    // })

    app.get('/peers', function (req, res) {
    })
    app.post('/peers/connect', blockchain.connectPeer)
    app.post('/peers/notify-new-block', function (req, res) {
    })

    // Default route
    router.get('*', function (req, res) {
        res.status(404).json({ message: 'This route does not exists.' })
    })
}
