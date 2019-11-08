const { sha256 } = require('../utils/hash')

class Block {
    constructor(index, difficulty, prevBlockHash, transactions, nonce, minedBy) {
        this.index = index;
        this.transactions = transactions;
        this.difficulty = difficulty;
        this.prevBlockHash = prevBlockHash;
        this.minedBy = minedBy;
        this.blockDataHash = sha256(JSON.stringify({ index, transactions, difficulty, prevBlockHash, minedBy }));
        this.nonce = nonce;
        this.dateCreated = new Date().toISOString();
        this.blockHash = sha256(JSON.stringify({ blockDataHash: this.blockDataHash, dateCreated: this.blockDataHash, nonce: this.nonce }));
    }
}

module.exports = Block;