const { BigNumber } = require('bignumber.js');

const moment = require('moment');
const Block = require('./Block');
const Transaction = require('./Transaction');
const { request, generateNodeId, address, NewPeerConnected, NewBlock, NewTransaction } = require('../utils/functions');

const BLOCKS_PER_MINUTE = 1;

class Node {
    constructor() {
        // Create node ID
        this.generateNodeId();

        // Iinicialize Blockchain
        this.createGenesis();

        this.onPeeerConnected = this.onPeeerConnected.bind(this);
        this.onNewBlock = this.onNewBlock.bind(this);

        // Event listeners
        NewPeerConnected.addListener('connection', this.onPeeerConnected)
        NewBlock.addListener('new_block', this.onNewBlock);
    }

    createGenesis() {
        // Blockchain attributes
        // blockchain inicialization
        this.blockchain = [];
        this.blocksCount = 0;

        // Transactions inicialization
        this.pendingTransactions = {};
        this.pendingTransactionsKeys = [];
        this.confirmedTransactions = {};
        this.confirmedTransactionsKeys = [];

        // Peers inicialization
        this.peers = {};
        this.miningJobs = {};

        // Addresses inicialization
        this.addresses = {};
        this.addressesKeys = [];

        // Difficulty inicialization
        this.currentDifficulty = process.env.difficulty || 4;
        this.setCumulativeDifficulty();

        //Create genesis block
        let genesisBlock = new Block(1, [], 0, '0'.repeat(40), null);
        genesisBlock.setMinedData(new Date().toISOString(), 0, '0'.repeat(64));
        this.blockchain.push(genesisBlock);
        this.id = `${new Date().toISOString()}${this.blockchain[0].blockHash}`;

    }

    setCumulativeDifficulty() {
        this.cumulativeDifficulty = new BigNumber(0);
        this.blockchain.forEach((block) => {
            this.cumulativeDifficulty.plus(new BigNumber(16).pow(block.difficulty));
        });
    }

    onNewTransaction(transaction) {
        Object.keys(this.peers).forEach(peer => {
            request(`${this.peers[peer]}/transaction/send`, 'POST', transaction)
                .catch(() => {
                    if (!error.status) {
                        delete this.peers[peer];
                    }
                });
        });
    }

    onNewBlock() {
        Object.keys(this.peers).forEach(peer => {
            request(`${this.peers[peer]}/peers/notify-new-block`, 'POST', {
                blocksCount: this.blockchain.length,
                cumulativeDifficulty: this.cumulativeDifficulty,
                nodeUrl: address()
            }).catch((error) => {
                if (!error.status) {
                    delete this.peers[peer];
                }
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
                this.setDifficulty(this.blockchain[this.blockchain.length - 2], this.blockchain[this.blockchain.length - 1]);
                NewBlock.emit('new_block');
            }
        } catch (error) {
            console.log(error)
        }
        console.log('\x1b[43m%s\x1b[0m', `syncronized with ${peer}`)
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
            peers: this.peers,
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
        if (this.addressesKeys.length > 0) {
            return this.addresses;
        }
        else {
            return false;
        }
    }

    getAddress(address) {
        if (this.addresses[address]) {
            return this.addresses[address];
        }
        else {
            return false;
        }
    }

    addBlock(block) {
        this.setDifficulty(this.blockchain[this.blockchain.length - 1], block);
        this.blockchain.push(block);
        this.addCumulativeDifficulty(block.difficulty);
        console.log('\x1b[46m%s\x1b[0m', 'New block mined!');
        NewBlock.emit('new_block');
    }

    addCumulativeDifficulty(blockDifficulty) {
        this.cumulativeDifficulty += Math.pow(16, blockDifficulty)
    }

    setDifficulty(prevBlock, newBlock) {
        let difference = moment(newBlock.dateCreated).diff(prevBlock.dateCreated, "minutes");
        if (difference < BLOCKS_PER_MINUTE) {
            this.currentDifficulty += 1;
        } else {
            this.cumulativeDifficulty -= 1;
        }
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
        this.addresses[addressData.address] = {
            address: addressData.address,
            safeBalance: 0,
            confirmedBalance: 0,
            pendingBalance: 0
        };
        this.addressesKeys.push(addressData.address);
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

    calculateMinerReward() {
        let base_reward = Math.round(
            (2110 / (this.blockchain.length * this.peers ? Object.keys(this.peers).length : 1)) * (this.pendingTransactions.length ? this.pendingTransactions.length : 1 * 12000)
        );
        let fees_sum = 0;
        this.pendingTransactions.forEach(transaction => {
            fees_sum += parseInt(transaction.fee);
        });
        return base_reward + fees_sum;
    }

    getNewBlockInfo(minerAddress) {
        // create candidate
        const candidateBlock = new Block(
            this.blockchain.length,
            [
                Transaction.coinbaseTransaction(
                    minerAddress, this.calculateMinerReward(),
                    0,
                    this.blockchain.length
                ),
                ...this.pendingTransactions,
            ],
            this.currentDifficulty,
            minerAddress,
            this.blockchain[this.blockchain.length - 1].blockHash,
        );
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
