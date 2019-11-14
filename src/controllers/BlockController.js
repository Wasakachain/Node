const { node } = require('../../index');
const Block = require('../models/Block');
const { paginateBlocks } = require('../utils/functions');

class BlockController {
    static receiveBlock(req, response) {
        const { blockDataHash, dateCreated, nonce, blockHash } = req.body;
        let block = node.miningJobs[blockDataHash]
        if (!block) {
            return response.status(404).send({ errorMsg: 'Block not found or already mined' });
        }

        block.setMinedData(dateCreated, nonce, blockHash);
        if (!Block.isValid(block)) {
            return response.status(400).send({ errorMsg: 'Invalid block' });
        }

        node.miningJobs = {};

        block.transactions.forEach((transaction) => {
            const index = node.pendingTransactionsKeys.findIndex((tx) => tx === transaction.transactionDataHash);
            if (index !== -1) {
                delete node.pendingTransactionsKeys[index]
                delete node.pendingTransactions[transaction.transactionDataHash];
            }
        });

        node.addBlock(block)
        return response.send({ message: `Block accepted, reward paid: ${block.transactions[0].value}` });
    }

    static createMiningJob(request, response) {
        const { minerAddress } = request.params;
        return response.send(node.newMiningJob(minerAddress));
    }

    static blockByIndex(request, response) {
        const { index: requestedIndex } = request.params;
        const block = node.blockchain.find(({ index }) => index == requestedIndex);
        if (block) {
            return response.json(block);
        }
        return response.status(404).send({
            index: requestedIndex,
            message: `Block not Found in chain`
        });
    }

    static blockIndex(req, response) {
        const { current_page, paginate } = req.query;
        return response.send(
            paginateBlocks(node.blockchain, { current_page, paginate })
        );
    }
}

module.exports = BlockController;