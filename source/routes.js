const Blockchain = require('./Blockchain.js');
const blockchain = new Blockchain();
const responseData = require('../utils/functions').responseData;

module.exports = (app) => {
    app.get('/info', blockchain.getInfo);
    app.get('/debug', function (req, res) {
    })
    app.get('/debug/reset-chain', blockchain.resetChain);

    app.get('/blocks', blockchain.getBlocks);
    app.get('/blocks/:index', blockchain.getBlockByIndex);
    app.get('/transactions/pending', function (req, res) {
    })
    app.get('/transactions/confirmed', function (req, res) {
    })
    app.get('/transactions/:hash', function (req, res) {
    })
    app.get('/balances', function (req, res) {
    })
    app.get('/address/:address/transactions', function (req, res) {
    })
    app.get('/address/:address/balance', function (req, res) {
    })
    app.post('/address/:invalidAddress/balance', function (req, res) {
    })
    app.post('/transactions/send', function (req, res) {
    })
    app.get('/mining/get-mining-job/:minerAddress', function (req, res) {
    })
    app.post('/mining/submit-mined-block', function (req, res) {
    })
    app.get('/debug/mine/:minerAddress/:difficulty', function (req, res) {
    });
    app.get('/peers', function (req, res) {
    })
    app.post('/peers/connect', function (req, res) {
    })
    app.post('/peers/notify-new-block', function (req, res) {
    })
    app.get('*', function (req, res) {
        res.status(404).json(responseData({ message: 'This route does not exists.' }))
    })
}