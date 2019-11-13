const { sha256 } = require('../utils/hash')
const Transactions = require('./Transaction');

class Block {
    constructor(index, transactions, difficulty, minedBy, prevBlockHash) {
        this.index = index;
        this.transactions = transactions;
        this.difficulty = typeof difficulty === 'string' ? parseInt(difficulty, 10) : difficulty;
        this.minedBy = minedBy;
        this.prevBlockHash = prevBlockHash;
        this.blockDataHash = sha256(JSON.stringify({ index, transactions, difficulty, prevBlockHash, minedBy }));
    }

    setMinedData(dateCreated, nonce, blockHash) {
        this.dateCreated = dateCreated;
        this.nonce = parseInt(nonce, 10);
        this.blockHash = blockHash;
    }

    static __validProof(block) {
        return '0'.repeat(block.difficulty) === block.blockHash.slice(0, block.difficulty);
    }

    static __validHash(block) {
        return sha256(JSON.stringify({ blockDataHash: block.blockDataHash, dateCreated: block.dateCreated, nonce: block.nonce })) == block.blockHash;
    }

    static isValid(block) {
        // TO DO: COMPLETE METHOD
        if ((!block.index || !block.difficulty || !block.prevBlockHash || !block.minedBy || !block.blockDataHash || !block.blockDataHash || !block.nonce || !block.dateCreated || !block.blockHash) || !Block.__validProof(block) || !Block.__validHash(block)) {
            return false;
        }

        // if (block.transactions.length > 0) {
        //     for (let i = 0; i < block.transactions.length; i++) {
        //         if (!Transactions.isValid(block.transactions[i])) {
        //             return false;
        //         }
        //     }
        // }
        return true;
    }
}

module.exports = Block;