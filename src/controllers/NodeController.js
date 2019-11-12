const { node } = require('../../index');

class NodeController {
    static nodeIndex(_, response) {
        let nodeData = node.index();
        return response.send(nodeData);
    }

    static debug(req, response) {
        return node.debugInfo().then(data => response.json(data))
    }

    static resetChain(req, response) {
        node.generateWasakaChain();
        return response.send({ message: 'The chain was reset to its genesis block' });
    }

    static getMinerDifficulty(req, response) {
        return response.send({ message: 'this is the miner difficulty: OMG' });
    }
}

module.exports = NodeController;