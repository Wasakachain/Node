const Block = require('./Block');
const { request } = require('../utils/functions');

class Blockchain {
    constructor() {
        this.createGenesis = this.createGenesis.bind(this);
        // create genesis block
        this.createGenesis();
        // this.getBlock = this.getBlock.bind(this);
        this.getAddresses = this.getAddresses.bind(this);
        this.getAddresses = this.getAddresses.bind(this);
    }

    createGenesis() {
        // Blockchain attributes
        this.chain = [];
        this.pendingTransactions = [];
        this.confirmedTransactions = [];
        this.blocksCount = 0;
        this.peers = {};
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

    isValidChain() {

    }

    synchronizeTransactions(nodeTransactions) {
        return [...this.pendingTransactions, ...nodeTransactions.filter((transaction) => {
            return this.pendingTransactions.find((tx) => tx.transactionDataHash === transaction.transactionDataHash) ? false : true;
        })];
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
        // Implement chain verification
        let newChain = null;
        let newTransactions = null;
        for (const node in this.peers) {
            try {
                let res = await request(`${node}/info`)
                if (res.cumulativeDifficulty > this.cumulativeDifficulty) {
                    res = await request(`${node}/blocks`);
                    newChain = res.chain;
                    let resTxs = await request(`${node}/transactions/pending`);
                    newTransactions = this.synchronizeTransactions(resTxs.transactions);
                }
            } catch (error) { }
        }

        if (newChain && newTransactions) {
            this.chain = newChain;
            this.pendingTransactions = newTransactions;
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