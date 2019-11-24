const blockchain = require('./Blockchain');


class Peer {
    static peers = {};

    constructor(peer) {
        Peer.peers[peerInfo.nodeUrl] = {
            ...peerInfo,
        }
    }

    static addPeer(peerInfo) {
        Peer.peers[peerInfo.nodeUrl] = peerInfo;
    }

    static removePeer(nodeUrl) {
        if (Peer.peers[nodeUrl]) {
            console.log(`Peer: ${nodeUrl} removed.`)
            delete Peer.peers[nodeUrl];
        }
    }

    static existsPeer(nodeUrl) {
        return Peer.peers.hasOwnProperty(nodeUrl);
    }

    static getPeerByUrl(nodeUrl) {
       return Object.values(Peer.peers).find(peer => peer.nodeUrl !== nodeUrl)
    }
}

module.exports = Peer;