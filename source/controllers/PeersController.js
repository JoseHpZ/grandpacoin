const { getNodeOwnIp } = require("../../utils/functions");
const blockchain = require("../models/Blockchain");
const Request = require("../../utils/Request");
const Url = require("url");
const Validator = require('../../utils/Validator');
const ClientSocket = require('../Sockets/ClientSocket');


class PeersController {
    static getConnectedPeers(request, response) {
        const { peers } = blockchain;
        return response
            .status(200)
            .json(peers);
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
                    validation: () => peerUrl !== `${request.protocol}://${request.get('host')}:${process.env.PORT}`,
                    message: 'Invalid peer url to connect.',
                }],
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
            console.log(err)
            return response.status(err.status).json({ message: err.message });
        }
    }

    static notifyNewBlock(request, response) {
        const { blocksCount, cumulativeDifficulty, nodeUrl } = request.body;
        return response
            .status(200)
            .json({ message: 'Thank you for the notification.', blocksCount, cumulativeDifficulty, nodeUrl })
    }
}

module.exports = PeersController;
