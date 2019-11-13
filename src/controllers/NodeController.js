const { node } = require('../../index');
const { request, NewBlock } = require('../utils/functions');
const CandidateBlock = require('../models/BlockCandidate');

class NodeController {
    static nodeIndex(_, response) {
        let nodeData = node.index();
        return response.send(nodeData);
    }

    static debug(req, response) {
        return node.debugInfo();
    }

    static resetChain(req, response) {
        node.generateWasakaChain();
        return response.send({ message: 'The chain was reset to its genesis block' });
    }

    static async debugMine(req, response) {
        const { minerAddress, difficulty } = req.params;
        let block = new CandidateBlock(node.newMiningJob(minerAddress, difficulty));
        const minedBlock = block.mine();
        block = node.miningJobs[minedBlock.blockDataHash]
        block.setMinedData(minedBlock.dateCreated, minedBlock.nonce, minedBlock.blockHash);
        node.setDifficulty(node.blockchain[node.blockchain.length - 1], block);
        node.blockchain.push(block);
        node.addCumulativeDifficulty(block.difficulty);
        console.log('\x1b[46m%s\x1b[0m', 'New block mined!');
        NewBlock.emit('new_block');
        return response.send({ message: 'New block mined!', block });
    }
}

module.exports = NodeController;