const Block = require('./Block');
const { request } = require('../utils/functions');
class Blockchain {
    constructor() {
        // Blockchain attributes
        this.chain = [];
        this.pendingTransactions = [];
        this.confirmedTransactions = [];
        this.blocksCount = 0;
        this.peers = [];
        this.addresses = [];
        this.cumulativeDifficulty = 0;
        this.miningJobs = [];
        //Create genesis block
        this.chain.push(new Block({
            index: 0,
            prevBlockHash: '0',
            previousDifficulty: 0,
            pendingTransactions: this.pendingTransactions,
            nonce: 0,
            minedBy: '00000000000000000000000000000000'
        }));
        this.getBlock = this.getBlock.bind(this);
        this.getAddresses = this.getAddresses.bind(this);
    }

    getAddresses() {
        if (this.addresses.length > 0) {
            return this.addresses;
        }
        else {
            return false;
        }
    }

    addCumulativeDifficulty(blockDifficulty) {
        this.cumulativeDifficulty += Math.pow(16, blockDifficulty)
    }

    async registerNode(address) {
        try {
            const res = await request(`${address}/info`);
            if (res) {
                this.peers.push(address);
            }
        } catch (error) { }
    }

    async synchronizeChain() {
        // TO DO
        // Implement chain verification
        let newChain = null;
        this.peers.forEach((peer) => {
            try {
                let res = await request(`${node}/info`)
                if (res.cumulativeDifficulty > this.cumulativeDifficulty) {
                    res = await request(`${node}/blocks`);
                    newChain = res.chain;
                }
            } catch (error) { }
        });

        if (newChain) {
            this.chain = newChain;
        }
    }

    addAddress(addressData) {
        this.addresses.push({
            address: addressData.address,
            safeBalance: 0,
            confirmedBalance: 0,
            pendingBalance: 0
        });
    }

}

module.exports = Blockchain;