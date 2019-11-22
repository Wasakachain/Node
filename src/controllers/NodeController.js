const { node } = require('../../index');
const { request } = require('../utils/functions');
const BlockCandidate = require('../models/BlockCandidate');

class NodeController {
    static nodeIndex(_, response) {
        let nodeData = node.index();
        return response.send(nodeData);
    }

    static debug(req, response) {
        return response.send(node.debugInfo());
    }

    static resetChain(req, response) {
        node.createGenesis();
        return response.send({ message: 'The chain was reset to its genesis block' });
    }

    static async debugMine(req, response) {
        const { minerAddress, difficulty } = req.params;
        let candidate = new BlockCandidate(node.newMiningJob(minerAddress, parseInt(difficulty, 10)));
        candidate = await candidate.mine();
        try {
            let res = await request('http://localhost:5555/mining/submit-mined-block', 'POST', candidate)
            return response.send(res);

        } catch (error) {
            return response.send(error);
        }
    }
}

module.exports = NodeController;