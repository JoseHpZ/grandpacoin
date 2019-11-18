const { getNodeOwnIp } = require("../../utils/functions");
const blockChain = require("../models/Blockchain");
const Request = require("../../utils/Request");
const Url = require("url");

class PeersController {
    static getConnectedPeers(request, response) {
        const { peers } = blockChain;
        return response
            .status(200)
            .json(peers);
    }

    static async connectPeer(request, response) {
        const { peerUrl } = request.body;
        const { peers, nodeId } = blockChain;
        try {
            const remoteNodeInfo = await Request.get(`${peerUrl}/info`);
            if (remoteNodeInfo.nodeId === nodeId) {
                return response.status(400).send({ message: 'Invalid peer url to connect' })
            }
            if (peers[remoteNodeInfo.nodeId]) {
                return response.status(409).send({ message: `Already connected to peer: ${peerUrl}` });
            }
            peers[remoteNodeInfo.nodeId] = peerUrl;
            const remoteUrl = Url.parse(peerUrl);
            await Request.post('/peers/connect', {
                hostname: remoteUrl.hostname,
                port: remoteUrl.port,
                body: {
                    peerUrl: getNodeOwnIp().peerUrl
                }
            })
            console.log(`Connected to peer ${peerUrl}`);
            return response.send({ message: `Connected to peer: ${peerUrl}` });
        } catch (error) {
            if (error.message) {
                console.log(`Connected to peer ${peerUrl}`);
                return response.send({ message: error.message });
            }
            console.log(`Connection to peer ${peerUrl} failed`);
            return response.send({ message: `Connected to peer: ${peerUrl}` });
        }
    }
}

module.exports = PeersController;
