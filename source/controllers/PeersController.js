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
                customValidations: [{
                    validation: () => !Peer.getPeer(peerUrl),
                    message: 'Peer connection already exists.',
                },
                {
                    validation: () => Peer.getPeerInfo().nodeUrl,
                    message: 'Invalid peer URL, you can not connect to your own node',
                }],
                name: 'peerUrl',
                value: peerUrl
            },
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
                customValidations: [{
                    validation: () => Peer.getPeer(nodeUrl),
                    message: 'You are not connected with peer: ' + nodeUrl + '. Consult your peers.',
                }],
                name: 'url',
                value: nodeUrl,
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
            eventEmmiter.emit(global.EVENTS.notify_block, ({
                blocksCount, cumulativeDifficulty, nodeUrl,
            }))
        });

        try {
            await once(eventEmmiter, global.EVENTS.notify_block);
            return response.status(200).json({
                message: 'Thank you for the notification.'
            })
        } catch (error) {
            return response.status(500).json({
                message: 'Unknown error. please try again.',
            })
        }
    }

    static async deletePeer({ body: { nodeUrl } }, response) {
        const validator = new Validator([
            {
                validations: ['isValidUrl'],
                name: 'nodeUrl',
                value: nodeUrl,
            },
            {
                customValidations: [{
                    validation: () => Peer.getPeer(nodeUrl),
                    message: 'You are not connected with peer: ' + nodeUrl + '. Consult your peers.',
                }],
                name: 'nodeUrl'
            },
        ]);

        if (validator.validate().hasError()) {
            return response
                .status(400)
                .json(validator.getErrors());
        }

        process.nextTick(() => {
            eventEmmiter.emit(global.EVENTS.remove_peer, (nodeUrl))
        });

        try {
            await once(eventEmmiter, global.EVENTS.remove_peer);
            return response.status(200).json({
                message: 'The peer has been removed.'
            })
        } catch (error) {
            return response.status(500).json({
                message: 'Unknown error. please try again.',
            })
        }
    }
}

module.exports = PeersController;
