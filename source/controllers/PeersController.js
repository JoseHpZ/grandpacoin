const Peer = require("../models/Peer");
const Validator = require('../../utils/Validator');
const ClientSocket = require('../Sockets/ClientSocket');


class PeersController {
    static async getConnectedPeers(request, response) {
        return response
            .status(200)
            .json(Peer.peers);
    }

    static async connectPeer(request, response) {
        const { peerUrl } = request.body;
        const validator = new Validator([
            {
                validations: ['isValidUrl'],
                name: 'url',
                value: peerUrl
            },
            {
                customValidations: [{
                    validation: () => !Peer.getPeerByUrl(peerUrl),
                    message: 'Peer connection already exists.',
                }],
                name: 'peerUrl'
            }
        ]);
        if (validator.validate().hasError()) {
            return response
                .status(400)
                .json(validator.getErrors());
        }

        try {
            await new ClientSocket(peerUrl).connect();
            return response.send({ message: `Connected to peer: ${peerUrl}` });
        } catch (err) {
            return response.status(err.status).json({ message: err.message });
        }
    }

    static async notifyNewBlock(request, response) {
        const { blocksCount, cumulativeDifficulty, nodeUrl } = request.body;
        return response
            .status(200)
            .json({ message: 'Thank you for the notification.', blocksCount, cumulativeDifficulty, nodeUrl })
    }
}

module.exports = PeersController;
