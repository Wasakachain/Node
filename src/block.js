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
        return response.send({ message: 'hello world' });
    }
}

module.exports = Block;