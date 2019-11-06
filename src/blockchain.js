const Block = require('./Block');
const Transaction = require('./transaction');
const { sha256 } = require('../utils');

class Blockchain {
    constructor() {
        this.blockchain = [];
        this.pendingTransaction = [];
    }

    get lastBlock() {
        return this.blockchain[this.blockchain.length - 1];
    }

    newBlock(proof, previousHash = null) {
        let block = new Block(this.blockchain.length + 1, Date.now(), this.pendingTransaction, proof, previousHash);

        this.pendingTransaction = [];
        this.blockchain.push(block);
        return block;
    }

    newTransaction(sender, recipient, amount) {
        this.pendingTransaction.push(new Transaction(sender, recipient, amount));

        return this.lastBlock.index + 1;
    }

    __addBlock(req, response) {
        return response.send({ message: `block added` });
    }

    validChain(chain) {
        let lastBlock = this.blockchain[0];
        for (let currentIndex = 1; currentIndex < this.blockchain.length; currentIndex++) {
            let block = this.blockchain[currentIndex];

            if (block.previousHash !== sha256(JSON.stringify(lastBlock))) {
                return false;
            }

            if (Blockchain.validProof(block)) {
                return false;
            }
        }
    }

    static proofOfWork(block) {
        while (!Blockchain.validProof(block)) {
            block.proof += 1;
        }
    }

    static validProof(block) {
        return sha256(JSON.stringify(block)).slice(0, 4) === '0000'
    }
}

module.exports = Blockchain;