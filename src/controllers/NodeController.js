const { node } = require('../../index');
const { minerThread } = require('../utils/functions');

class NodeController {
    static nodeIndex(_, response) {
        let nodeData = node.index();
        return response.send(nodeData);
    }

    static debug(req, response) {
        return response.send(node.debugInfo());
    }

    static resetChain(req, response) {
        node.generateWasakaChain();
        return response.send({ message: 'The chain was reset to its genesis block' });
    }

    static async debugMine(req, response) {
        const { minerAddress, difficulty } = req.params;
        return minerThread(req, response, { candidateBlock: node.newMiningJob(minerAddress, difficulty) });
    }
}

module.exports = NodeController;