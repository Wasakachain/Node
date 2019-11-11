const Block = require('./Block');
const Transaction = require('./Transaction');
const { request, generateNodeId, address, newPeerConnected, newBlock } = require('../utils/functions');

class Node {
    constructor() {
        this.generateNodeId();
        this.createGenesis();

        this.onPeeerConnected = this.onPeeerConnected.bind(this);
        this.onNewBlock = this.onNewBlock.bind(this);

        newPeerConnected.addListener('connection', this.onPeeerConnected)
        newBlock.addListener('new_block', this.onNewBlock);
    }

    setCumulativeDifficulty() {
        this.cumulativeDifficulty = 0;
        this.blockchain.forEach((block) => {
            this.cumulativeDifficulty += Math.pow(16, block.difficulty);
        });
    }

    onNewBlock() {
        Object.keys(this.peers).forEach(peer => {
            request(`${this.peers[peer]}/peers/notify-new-block`, 'POST', {
                blocksCount: this.blockchain.length,
                cumulativeDifficulty: this.cumulativeDifficulty,
                nodeUrl: address()
            }).catch(() => {
                delete this.peers[peer];
            });
        });
    }

    async onPeeerConnected(peer) {
        await this.checkBetterChain(peer);
    }

    shouldDownloadChain(difficulty) {
        return difficulty > this.cumulativeDifficulty
    }

    async checkBetterChain(peer) {
        let res = await request(`${peer}/info`);
        if (this.shouldDownloadChain(res.data.cumulativeDifficulty)) {
            await this.synchronizePeer(peer);
        }
    }

    async synchronizePeer(peer) {
        try {
            let res = await request(`${peer}/blocks`);
            if (!Node.verifyChain(res.data)) return;
            let newChain = res.data;
            let resTxs = await request(`${peer}/transactions/pending`);
            let newTransactions = this.synchronizeTransactions(resTxs.data.transactions);
            if (newChain) {
                this.blockchain = newChain;
                this.pendingTransactions = newTransactions;
                this.setCumulativeDifficulty()
                newBlock.emit('new_block');
            }
        } catch (error) {
            console.log(error)
        }
        console.log(`syncronized with ${peer}`)
    }

    createGenesis() {
        // Blockchain attributes
        this.blockchain = [];
        this.pendingTransactions = [];
        this.confirmedTransactions = [];
        this.blocksCount = 0;
        this.peers = {};
        this.addresses = [];
        this.currentDifficulty = process.env.difficulty || 4;
        this.miningJobs = {};
        //Create genesis block
        let genesisBlock = new Block(1, [], 0, '0'.repeat(40), null);
        genesisBlock.setMinedData(new Date().toISOString(), 0, '0'.repeat(64));
        this.blockchain.push(genesisBlock);
        this.id = `${new Date().toISOString()}${this.blockchain[0].blockHash}`;

        this.setCumulativeDifficulty();
    }

    index() {
        return {
            about: 'WasakaChain Blockchain Node',
            nodeID: this.nodeID,
            nodeUrl: address(),
            ...this.getGeneralInfo()
        }
    }

    async debugInfo() {
        let nodeInfo = this.getNodeInfo();
        let blockchainFullInfo = await this.getFullInfo();
        return {
            ...nodeInfo,
            ...blockchainFullInfo
        };
    }

    getNodeInfo() {
        return {
            selfUrl: address(),
            nodeID: this.nodeID,
        }
    }

    getGeneralInfo() {
        return {
            chainID: this.id,
            blocksCount: this.blocksCount,
            cumulativeDifficulty: this.cumulativeDifficulty,
            confirmedTransactions: this.confirmedTransactions.length,
            pendingTransactions: this.pendingTransactions.length,
            peers: this.peers
        }
    }

    getFullInfo() {
        return {
            peers: this.peers,
            chain: {
                chainID: this.id,
                blocks: this.blockchain,
                cumulativeDifficulty: this.cumulativeDifficulty,
            },
            pendingTransactions: this.pendingTransactions,
            confirmedBalances: this.getConfirmedBalances()
        }
    }

    getAddresses() {
        if (this.addresses.length > 0) {
            return this.addresses;
        }
        else {
            return false;
        }
    }

    addBlock(block) {
        this.blockchain.push(block);
        this.addCumulativeDifficulty(block.difficulty);
        console.log('New block mined!');
        newBlock.emit('new_block');
    }

    addCumulativeDifficulty(blockDifficulty) {
        this.cumulativeDifficulty += Math.pow(16, blockDifficulty)
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

    static verifyChain(chain) {
        // TO DO: complete method
        for (let i = 1; i < chain.length; i++) {
            if (!Block.isValid(chain[i])) {
                return false;
            }
        }
        return true;
    }

    addAddress(addressData) {
        this.addresses.push({
            address: addressData.address,
            safeBalance: 0,
            confirmedBalance: 0,
            pendingBalance: 0
        });
    }

    getConfirmedBalances() {
        let addresses = this.getAddresses();
        if (addresses) {
            return addresses.filter(({ confirmedBalance }) => confirmedBalance !== 0);
        }
        return [];
    }

    generateNodeId() {
        this.nodeID = generateNodeId();
    }

    getAddressesSafeBalances() {
        let addresses = this.getAddresses();
        if (addresses) {
            return addresses.filter(({ confirmedBalance }) => confirmedBalance !== 0)
                .map(({ address, safeBalance }) => {
                    return {
                        [address]: safeBalance
                    };
                });
        }
        return null;
    }

    getNewBlockInfo(minerAddress) {
        // create candidate
        const candidateBlock = new Block(
            this.blockchain.length,
            this.pendingTransactions,
            this.currentDifficulty,
            minerAddress,
            this.blockchain[this.blockchain.length - 1] ? this.blockchain[this.blockchain.length - 1].blockHash : undefined
        )

        this.miningJobs[candidateBlock.blockDataHash] = candidateBlock;

        return {
            index: this.blockchain.length,
            transactionsIncluded: this.pendingTransactions.length,
            difficulty: this.currentDifficulty,
            expectedReward: process.env.reward || 1,
            rewardAddress: minerAddress,
            blockDataHash: candidateBlock.blockDataHash,
        };
    }
}

module.exports = Node;