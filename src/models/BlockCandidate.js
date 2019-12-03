const { sha256 } = require('../utils/hash');

class BlockCandidate {
    /**
     * Block represetation class
     * @param {*} blockCandidate  block candidate 
     */
    constructor({ index, transactionsIncluded, difficulty, expectedReward, rewardAddress, blockDataHash }) {
        this.index = index;
        this.transactionsIncluded = transactionsIncluded;
        this.difficulty = typeof difficulty === 'string' ? parseInt(difficulty, 10) : difficulty;
        this.expectedReward = expectedReward;
        this.rewardAddress = rewardAddress;
        this.blockDataHash = blockDataHash;

        this.nonce = 0;
        this.dateCreated = new Date().toISOString();
    }

    /**
     * Returns true when the block has a valid proof
     * @returns {boolean}
     */
    validProof() {
        return "0".repeat(this.difficulty) === this.hash().slice(0, this.difficulty);
    }

    /**
     * Returns the block hash
     * @returns {string}
     */
    hash() {
        return sha256(JSON.stringify({ blockDataHash: this.blockDataHash, dateCreated: this.dateCreated, nonce: this.nonce.toString(10) }));
    }

    /**
     * Mine the block
     */
    mine() {
        return new Promise(resolve => {
            this.nonce = 0;
            while (!this.validProof()) {
                this.nonce++;
            }
            return resolve({
                blockDataHash: this.blockDataHash,
                dateCreated: this.dateCreated,
                nonce: this.nonce.toString(10),
                blockHash: this.hash(),
            });
        })
    }

}

module.exports = BlockCandidate;