const { sha256 } = require('../utils/hash')
const Transactions = require('./Transaction');

class Block {
    constructor(index, transactions, difficulty, minedBy, prevBlockHash) {
        this.index = index;
        this.transactions = transactions;
        this.difficulty = difficulty;
        this.minedBy = minedBy;
        this.prevBlockHash = prevBlockHash;
        this.blockDataHash = sha256(JSON.stringify({ index, transactions, difficulty, prevBlockHash, minedBy }));
    }

    setMinedData(dateCreated, nonce, blockHash) {
        this.dateCreated = dateCreated;
        this.nonce = nonce;
        this.blockHash = blockHash;
    }

    __validProof() {
        return '0'.repeat(this.difficulty) === this.blockHash.slice(0, this.difficulty);
    }

    __validHash() {
        return sha256({ blockDataHash: this.blockDataHash, dateCreated: this.dateCreated, nonce: this.nonce }) === this.blockHash;
    }


    static isValid(block) {
        // TO DO: COMPLETE METHOD
        if ((!block.index || !block.transactions || !block.difficulty || !block.prevBlockHash || !block.minedBy || !block.blockDataHash || !block.blockDataHash || !block.nonce || !block.dateCreated || !block.blockHash) || !this.__validProof() || !this.__validHash()) {
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