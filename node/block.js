class Block {
    constructor(index, timestamp, transactions, proof, previousHash) {
        this.index = index;
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.proof = proof;
        this.previousHash = previousHash;

        this.nodes = [];
    }
}

module.exports = Block;