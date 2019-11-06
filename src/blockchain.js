const Block = require('./Block');
const Transaction = require('./transaction');
const { sha256 } = require('../utils');
const { request } = require('../utils');

class Blockchain {
    constructor() {
        this.chain = [];
        this.pendingTransaction = [];
        this.peers = [];
    }

    get lastBlock() {
        return this.chain[this.chain.length - 1];
    }

    newTransaction(from, to, value, fee, dateCreated, data, senderPubKey) {
        this.pendingTransaction.push(new Transaction(from, to, value, fee, dateCreated, data, senderPubKey));
        // return this.lastBlock.index + 1;
    }

    registerNode(url) {
        this.peers.push(url);
    }

    __addBlock(req, response) {
        return response.send({ message: `block added` });
    }

    validChain(chain) {
        let lastBlock = this.blockchain[0];
        for (let currentIndex = 1; currentIndex < this.blockchain.length; currentIndex++) {
            let block = this.blockchain[currentIndex];

            if (block.previousHash !== sha256(JSON.stringify(lastBlock))) {
                console.log(`Previous hash does not match on block ${currentIndex}`);
                return false;
            }

            if (Blockchain.validProof(block)) {
                console.log(`Invalid proof of work on block ${currentIndex}`);
                return false;
            }
        }
    }

    resolveConflict() {
        let newChain = null;
        let maxLenght = this.chain;

        this.peers.forEach((node) => {
            let res = request()
        });
    }
}

module.exports = Blockchain;