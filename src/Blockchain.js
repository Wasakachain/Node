// const responseData = require('../utils/functions').responseData;
const Block = require('./Block');
// const initialDifficulty = require('../global').initialDifficulty;

class Blockchain {
    constructor() {
        this.chain = [];
        this.pendingTransactions = [];
        this.confirmedTransactions = [];
        this.blocksCount = 0;
        this.nodes = [];

        //Create genesis block
        this.chain.push(new Block({
            index: 0,
            prevBlockHash: '0',
            previousDifficulty: 0,
            pendingTransactions: this.pendingTransactions,
            nonce: 0,
            minedBy: '00000000000000000000000000000000'
        }));
        this.getBlock = this.getBlock.bind(this);
    }

    getBlock(req, response) {
        if (!req.params.index || !this.chain[req.params.index]) {
            return response
                .status(404)
                .json({ message: 'Block not found' });
        }
        return response.json(this.chain[req.params.index]);
    }

}

module.exports = Blockchain;