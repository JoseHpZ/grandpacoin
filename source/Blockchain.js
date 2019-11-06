const responseData = require('../utils/functions').responseData;

class Blockchain {
    constructor() {
        this.chain = [];
        this.pendingTransactions = [];
        this.confirmedTransactions = [];
        this.blocksCount = 0;
        this.nodes = [];
        this.getBlock = this.getBlock.bind(this)
    }

    getBlock(req, response) {
        if (!req.params.index || !this.chain[req.params.index]) {
            return response
                .status(404)
                .json(responseData({ message: 'Block not found' }));
        }
        return response.json(responseData(this.chain[req.params.index]));
    }
}

module.exports = Blockchain;