const moment = require('moment');
const time = require('../global').time;

function setDifficulty(last_block, new_block, currentDifficulty) {
    let averageTime = moment(last_block.timestamp).diff(moment(new_block.timestamp), "minutes");
    if (averageTime < time) {
        return currentDifficulty += 1;
    }
    else if (averageTime > time) {
        return currentDifficulty -= 1;
    }

}

module.exports = {
    setDifficulty
}