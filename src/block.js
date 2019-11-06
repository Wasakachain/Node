class Block {
    constructor(index, timestamp, transactions, proof, previousHash) {
        this.index = index;
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.proof = proof;
        this.previousHash = previousHash;
        this.nodes = [];
        // binding methods
        this.__index = this.__index.bind(this);
        this.__show = this.__show.bind(this);
    }

    __index(req, response) {
        return response.send({ message: 'hello world' });
    }

    __show(req, response) {
        return response.send({ message: `this is the block number: ${req.params.index}` });
    }
}

module.exports = Block;