const BigNumber = require('bignumber.js');

class GrandpaCoin {
    toGrandpaCoin(amount) {
        return BigNumber(amount).dividedBy(global.coins.grandpa).toString() + ' Grandpa';
    }
    
    toSonCoin(amount) {
        return BigNumber(amount).dividedBy(global.coins.son).toString() + ' Son';
    }
    
    toGrandsonCoin(amount, coinType) {
        return BigNumber(amount).dividedBy(global.coins[coinType]).toString();
    }
}

module.exports = GrandpaCoin;