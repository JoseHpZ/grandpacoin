const Peer = require("../models/Peer");
const Validator = require('../../utils/Validator');
const ClientSocket = require('../Sockets/ClientSocket');
const eventEmmiter = require('../Sockets/eventEmmiter');
const { once } = require('events');

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
                    validation: () => !Peer.getPeer(peerUrl),
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
        const validator = new Validator([
            {
                validations: ['isValidUrl'],
                name: 'url',
                value: nodeUrl,
            },
            {
                customValidations: [{
                    validation: () => Peer.getPeer(nodeUrl),
                    message: 'You are not connect with the peer ' + nodeUrl + ' consult your peers.',
                }],
                name: 'nodeUrl'
            },
            {
                validations: ['required', 'integer'],
                name: 'blocksCount',
                value: blocksCount,
            },
            {
                validations: ['required', 'string'],
                name: 'cumulativeDifficulty',
                value: cumulativeDifficulty,
            },
        ]);

        if (validator.validate().hasError()) {
            return response
                .status(400)
                .json(validator.getErrors());
        }

        process.nextTick(() => {
            eventEmmiter.emit('notify_block', ({
                blocksCount, cumulativeDifficulty, nodeUrl,
            }))
        });

        try {
            await once(eventEmmiter, 'notify_block');
            return response.status(200).json({
                message: 'Thank you for the notification.'
            })
        } catch (error) {
            return response.status(500).json({
                message: 'Uknow error. please try again.',
            })
        }
    }

    static async deletePeer(req, res) {
        if (!Peer.existsPeer(nodeUrl)) {
            response.status(404).json({
                message: 'You don\'t are syncronized with peer ' + nodeUrl, 
            })
        }

    }
}

module.exports = PeersController;
