function routes(app, blockchain) {
    try {
        app.get('/info', function (req, res) {
        })
        app.get('/debug', function (req, res) {
        })
        app.get('/reset-chain', function (req, res) {
        })
        app.get('/blocks', function (req, res) {
        })
        app.get('/blocks/:index', function (req, res) {
        })
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
    } catch (e) {
        console.log('Something was wrong, details: ', e.stack());
    }
}

module.exports = routes;