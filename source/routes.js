const Blockchain = require('./Blockchain.js');
const blockchain = new Blockchain();
const responseData = require('../utils/functions').responseData;

module.exports = (app) => {

    // Blockchain info
    app.get('/info', blockchain.getInfo);
    app.get('/debug', blockchain.debug);
    app.get('/debug/reset-chain', blockchain.resetChain);
    app.get('/debug/mine/:minerAddress/:difficulty', function (req, res) {
    });

    // Blocks routes
    app.get('/blocks', blockchain.getBlocks);
    app.get('/blocks/:index', blockchain.getBlockByIndex);

    // Transaction routes
    app.get('/transactions/pending', blockchain.getPendingTransactions);
    app.get('/transactions/confirmed', blockchain.confirmedTransactions);
    app.post('/transactions/send', blockchain.sendTransaction)
    app.get('/transaction/:hash', blockchain.getTransactionByHash)
    app.get('/address/:address/transactions', function (req, res) {
    })
    app.get('/balances', blockchain.getAddressesBalances);
    app.get('/address/:address/transactions', blockchain.listTransactionForAddress);
    app.get('/address/:address/balance', blockchain.getAllBalancesForAddress);
    app.post('/transactions/send', blockchain.sendTransaction);
    app.get('/mining/get-mining-job/:minerAddress', blockchain.getMiningJob)
    app.post('/mining/submit-mined-block', function (req, res) {
    })

    // Peers routes
    app.get('/peers', function (req, res) {
    })
    app.post('/peers/connect', function (req, res) {
    })
    app.post('/peers/notify-new-block', function (req, res) {
    })

    // Default route
    app.get('*', function (req, res) {
        res.status(404).json({ message: 'This route does not exists.' })
    })
}
