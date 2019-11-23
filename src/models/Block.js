const { sha256 } = require('../utils/hash')
const Transaction = require('./Transaction');
class Block {
    constructor(index, transactions, difficulty, minedBy, prevBlockHash) {
        this.index = index;
        this.transactions = transactions;
        this.difficulty = typeof difficulty === 'string' ? parseInt(difficulty, 10) : difficulty;
        this.minedBy = minedBy;
        this.prevBlockHash = prevBlockHash;
        this.blockDataHash = sha256(JSON.stringify({ index, transactions: Block.getTransactionsToHash(transactions), difficulty, prevBlockHash, minedBy }));
    }

    static getTransactionsToHash(transactions) {
        return transactions.map((tx) => {
            return Transaction.getDataForHash(tx);
        })
    }

    setMinedData(dateCreated, nonce, blockHash) {
        this.dateCreated = dateCreated;
        this.nonce = nonce;
        this.blockHash = blockHash;
    }

    static __validDataHash(block) {
        const { index, transactions, difficulty, prevBlockHash, minedBy } = block;
        return sha256(JSON.stringify({ index, transactions: this.getTransactionsToHash(transactions), difficulty, prevBlockHash, minedBy })) == block.blockDataHash;
    }

    static __validProof(block) {
        return '0'.repeat(block.difficulty) === block.blockHash.slice(0, block.difficulty);
    }

    static __validHash(block) {
        return sha256(JSON.stringify({ blockDataHash: block.blockDataHash, dateCreated: block.dateCreated, nonce: block.nonce })) == block.blockHash;
    }

    static isValid(block) {
        if ((!block.index || !block.difficulty || !block.prevBlockHash || !block.minedBy || !block.blockDataHash || !block.blockDataHash || !block.nonce || !block.dateCreated || !block.blockHash) || !Block.__validProof(block) || !Block.__validHash(block) || !Block.__validDataHash(block)) {
            return false;
        }
        return true;
    }
}

module.exports = Block;