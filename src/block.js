class Block {
    constructor(index, transactions, difficulty, prevBlockHash, minedBy, blockDataHash, nonce, dateCreated, blockHash) {
        this.index = index;
        this.transactions = transactions;
        this.difficulty = difficulty;
        this.prevBlockHash = prevBlockHash;
        this.minedBy = minedBy;
        this.blockDataHash = blockDataHash;
        this.nonce = nonce;
        this.dateCreated = dateCreated;
        this.blockHash = blockHash;
    }

    index(req, response) {
        console.log('hello');
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