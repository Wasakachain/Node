const { BigNumber } = require('bignumber.js');

const moment = require('moment');
const Block = require('./Block');
const Transaction = require('./Transaction');
const { request, generateNodeId, address, NewPeerConnected, NewBlock, NewTransaction } = require('../utils/functions');
const Address = require('../models/Address');

const BLOCKS_PER_MINUTE = 1;

class Node {
    constructor() {
        // Create node ID
        this.generateNodeId();

        // Iinicialize Blockchain
        this.createGenesis();

        // Peers initialization
        this.peers = {};

        this.onPeeerConnected = this.onPeeerConnected.bind(this);
        this.onNewBlock = this.onNewBlock.bind(this);
        this.onNewTransaction = this.onNewTransaction.bind(this);

        // Event listeners
        NewPeerConnected.addListener('connection', this.onPeeerConnected)
        NewBlock.addListener('new_block', this.onNewBlock);
        NewTransaction.addListener('transaction', this.onNewTransaction);
    }

    createGenesis() {
        // Blockchain attributes
        // blockchain initialization
        this.blockchain = [];

        // Transactions initialization
        this.pendingTransactions = {};
        this.pendingTransactionsKeys = [];
        this.confirmedTransactions = {};
        this.confirmedTransactionsKeys = [];

        this.miningJobs = {};

        // Addresses initialization
        this.addresses = {};
        this.addressesKeys = [];

        // Difficulty initialization
        this.currentDifficulty = process.env.difficulty || 4;
        this.setCumulativeDifficulty();

        //Create genesis block
        let genesisTransactions = Transaction.genesisTransaction();
        let genesisBlock = new Block(0, [genesisTransactions], 0, '0'.repeat(40), null);
        genesisBlock.setMinedData(new Date().toISOString(), 0, '0'.repeat(64));
        this.blockchain.push(genesisBlock);
        this.confirmedTransactions = {
            ...this.confirmedTransactions,
            genesisTransactions
        };
        this.id = `${new Date().toISOString()}${this.blockchain[0].blockHash}`;
        this.newBlockBalances();

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
            if (!this.validateNewChain(res.data)) return;
            let resTxs = await request(`${peer}/transactions/pending`);
            this.synchronizeTransactions(resTxs.data.transactions);
            NewBlock.emit('new_block');
        } catch (error) {
            console.log(error)
        }
        console.log('\x1b[43m%s\x1b[0m', `syncronized with ${peer}`)
    }

    validateNewChain(chain) {
        let newBalances = {};
        for (let i = 1; i < chain.length; i++) {
            if (!Block.isValid(chain[i])) {
                return false;
            }
            for (let j = 0; j < chain[i].transactions.length; j++) {
                if (!Transaction.isValid(chain[i].transactions[j])) return false;
                Address.checkBalances(newBalances, chain[i].transactions[j], chain.length);
            }
        }
        this.addresses = newBalances;
        this.blockchain = chain;
        return true;
    }

    newBlockBalances() {
        this.blockchain.forEach((block) => {
            block.transactions.forEach((tx) => {
                Address.checkBalances(this.addresses, tx, this.blockchain.length);
            });
        })
        this.addressesKeys = Object.keys(this.addresses);
    }

    addBlock(block) {
        this.setDifficulty(this.blockchain[this.blockchain.length - 1], block);
        this.blockchain.push(block);
        this.newBlockBalances();
        this.addCumulativeDifficulty(block.difficulty);
        console.log('\x1b[46m%s\x1b[0m', 'New block mined!');
        NewBlock.emit('new_block');
        this.newBlockBalances();
    }

    addCumulativeDifficulty(blockDifficulty) {
        this.cumulativeDifficulty += Math.pow(16, blockDifficulty)
    }

    setDifficulty(prevBlock, newBlock) {
        return 4;
        let difference = moment(newBlock.dateCreated).diff(prevBlock.dateCreated, "minutes");
        if (difference < BLOCKS_PER_MINUTE) {
            this.currentDifficulty += 1;
        } else {
            this.cumulativeDifficulty -= 1;
        }
    }

    synchronizeTransactions(nodeTransactions) {
        this.pendingTransactions = [...Object.values(this.pendingTransactions), ...Object.values(nodeTransactions).filter((transaction) => {
            return !this.pendingTransactions[transaction.transactionDataHash];
        })];

        this.pendingTransactionsKeys = Object.keys(this.pendingTransactionsKeys);
    }

    async registerNode(address) {
        try {
            const res = await request(`${address}/info`);
            if (res) {
                this.peers.push(address);
            }
        } catch (error) { }
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

    calculateMinerReward() {
        let base_reward = 5000000;
        let fees_sum = 0;
        this.pendingTransactionsKeys.forEach(transaction => {
            fees_sum += parseInt(transaction.fee);
        });
        return base_reward + fees_sum;
    }

    newMiningJob(minerAddress, difficulty) {
        // create candidate
        const candidateBlock = new Block(
            this.blockchain.length,
            [
                Transaction.coinbaseTransaction(
                    minerAddress, this.calculateMinerReward(),
                    0,
                    this.blockchain.length
                ),
                ...Object.values(this.pendingTransactions),
            ],
            difficulty || this.currentDifficulty,
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

    /**
     *
     *   GETTERS
     *  
     */

    index() {
        return {
            about: 'WasakaChain Blockchain Node',
            nodeID: this.nodeID,
            nodeUrl: address(),
            ...this.getGeneralInfo()
        }
    }

    debugInfo() {
        let nodeInfo = this.getNodeInfo();
        let blockchainFullInfo = this.getFullInfo();
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
            cumulativeDifficulty: this.cumulativeDifficulty,
            confirmedTransactions: this.confirmedTransactionsKeys.length,
            pendingTransactions: this.pendingTransactionsKeys.length,
            peers: this.peers,
        }
    }

    getFullInfo() {
        return {
            peers: this.peers,
            balances: this.addresses,
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

    getConfirmedBalances() {
        // if (addresses) {
        //     return addresses.filter(({ confirmedBalance }) => confirmedBalance !== 0 || );
        // }
        return this.addresses;
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
}

module.exports = Node;
