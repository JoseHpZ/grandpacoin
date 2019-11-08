const crypto = require('crypto');
const uuidv4 = require('uuid/v4');

function generateNodeId() {
    return crypto
        .createHash('sha256')
        .update((new Date()).toISOString() + uuidv4())
        .digest('hex');
}

module.exports = {
    generateNodeId,
}