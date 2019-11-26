const Events = require('events');

const eventEmitter = new Events();
eventEmitter.on('new_chain', () => { });

module.exports = eventEmitter;