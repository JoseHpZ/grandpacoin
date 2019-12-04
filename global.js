global.appName = 'GrandpaCoin/0.1';
global.initialDifficulty = 4;
global.time = 8;
global.coins = {
    grandpa: 1000000,
    son: 1000,
    grandson: 1
};
global.minimumTransactionFee = 10;
global.blockReward = 5000000;
global.coinNames = {
    grandpa: 'grandpa',
    son: 'son',
    grandson: 'grandson'
}
global.originDate = '2019-11-09T01:05:06.705Z';

global.CHANNELS_ACTIONS = {
    GET_CHAIN: 'GET_CHAIN',
    NEW_CHAIN: 'NEW_CHAIN',
    GET_PENDING_TX: 'GET_PENDING_TX',
    SET_PENDING_TRANSACTIONS: 'SET_PENDING_TRANSACTIONS',
    ADD_NEW_TRANSACTION: 'ADD_NEW_TRANSACTION',
    NEW_BLOCK: 'NEW_BLOCK',
    RECEIVE_INFO: 'RECEIVE_INFO',
    NOTIFY_BLOCK: 'NOTIFY_BLOCK',
    NEW_PEER: 'NEW_PEER',
    REMOVE_PEER: 'REMOVE_PEER',
};

global.CHANNELS = {
    NEW_CONNECTION: 'NEW_CONNECTION',
    CLIENT_CHANNEL: 'CLIENT_CHANNEL',
    PUBLIC_CONNECTION: 'PUBLIC_CONNECTION',
}

global.ROOMS = {
    NODE: 'NODE',
    PUBLIC: 'PUBLIC',
}

global.EVENTS = {
    new_chain : 'new_chain',
    new_transaction : 'new_transaction',
    new_block : 'new_block',
    notify_block : 'notify_block',
    remove_peer : 'remove_peer',
}