const { sha256 } = require('../utils/hash')
const Transactions = require('./Transaction');

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

    static isValid(block) {
        // TO DO: COMPLETE METHOD
        if (!block.index || !block.transactions || !block.difficulty || !block.prevBlockHash || !block.minedBy || !block.blockDataHash || !block.blockDataHash || !block.nonce || !block.dateCreated || !block.blockHash) {
            return false;
        }

        for (const transaction in block.transactions) {
            if (!Transactions.isValid(transaction)) {
                return false;
            }
        }

        return true;
    }
}

module.exports = Block;