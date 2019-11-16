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
        this.pendingTransactions = [];
        this.confirmedTransactions = [];

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
        genesisBlock.setMinedData('2019-11-14T23:33:03.915Z', 0, '0'.repeat(64));
        this.blockchain.push(genesisBlock);
        this.confirmedTransactions = [
            ...this.confirmedTransactions,
            genesisTransactions
        ];
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
            request(`${this.peers[peer]}/transactions/send`, 'POST', transaction)
                .catch((error) => {
                    if (!error.status) {
                        delete this.peers[peer];
                    }
                });
        });

        this.pendingTransactions.sort((a, b) => {
            if (a.fee > b.fee) {
                return -1;
            }

            if (a.fee < b.fee) {
                return 1;
            }

            return 0;
        });
        this.checkPendingBalances();

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
        this.pendingTransactions.sort((a, b) => {
            if (a.fee > b.fee) {
                return -1;
            }

            if (a.fee < b.fee) {
                return 1;
            }

            return 0;
        });
        this.checkPendingBalances();
    }

    async onPeeerConnected(peer) {
        await this.synchronizePeer(peer);
    }

    shouldDownloadChain(difficulty) {
        return new BigNumber(difficulty).comparedTo(this.cumulativeDifficulty) > 0;
    }

    async synchronizePeer(peer) {
        try {
            let res = await request(`${peer}/info`);
            if (this.shouldDownloadChain(res.data.cumulativeDifficulty)) {
                await this.synchronizeChain(peer);
            }
            await this.synchronizeTransactions(peer);
        } catch (error) {
            console.log(error);
        }
    }

    async synchronizeTransactions(peer) {
        try {
            let resTxs = await request(`${peer}/transactions/pending`);
            this.updateTransactions(resTxs.data);
            console.log('\x1b[43m%s\x1b[0m', `syncronized with ${peer}`)
        } catch (error) {
            console.log(error)
        }
    }

    async synchronizeChain(peer) {
        try {
            let res = await request(`${peer}/blocks`);
            if (!this.validateNewChain(res.data)) return;
            NewBlock.emit('new_block');
            console.log('\x1b[43m%s\x1b[0m', `syncronized with ${peer}`)
        } catch (error) {
            console.log(error)
        }
    }

    validateNewChain(chain) {
        let newBalances = {};
        for (let i = 0; i < chain.length; i++) {
            for (let j = 0; j < chain[i].transactions.length; j++) {
                if (!Transaction.isValid(chain[i].transactions[j])) return false;
                Address.checkBalances(newBalances, chain[i].transactions[j], chain.length);
            }

            if (i !== 0 && !Block.isValid(chain[i])) {
                return false;
            }
        }
        this.addresses = newBalances;
        this.blockchain = chain;
        return true;
    }

    newBlockBalances() {
        let newBalances = {}
        this.blockchain.forEach((block) => {
            block.transactions.forEach((tx) => {
                Address.checkBalances(newBalances, tx, this.blockchain.length);
            });
        })
        this.addresses = newBalances;
        this.addressesKeys = Object.keys(this.addresses);
    }

    addBlock(block) {
        this.setDifficulty(this.blockchain[this.blockchain.length - 1], block);
        this.blockchain.push(block);
        this.addCumulativeDifficulty(block.difficulty);
        console.log('\x1b[46m%s\x1b[0m', 'New block mined!');
        NewBlock.emit('new_block');
        this.newBlockBalances();
        block.transactions.forEach((tx) => {
            tx.minedInBlockIndex = block.index;
            this.confirmedTransactions = [
                ...this.confirmedTransactions,
                tx
            ];
        })
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

    updateTransactions(nodeTransactions) {
        let newTransactions = {};
        [...this.pendingTransactions, ...nodeTransactions].forEach((transaction, index) => {
            if (newTransactions[transaction.transactionDataHash]) {
                return;
            }
            newTransactions[transaction.transactionDataHash] = transaction;
        });

        this.pendingTransactions = Object.values(newTransactions);
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

    checkPendingBalances() {
        Object.values(this.addresses).forEach((address) => address.pendingBalance = new BigNumber(0));
        this.pendingTransactions.forEach((tx) => {
            if (!this.addresses[tx.to]) {
                this.addresses[tx.to] =
                    new Address(tx.to);
            }

            if (!this.addresses[tx.to].pendingBalance.isZero()) {
                this.addresses[tx.to].pendingBalance = this.addresses[tx.to].pendingBalance.plus(new BigNumber(tx.value));
            } else {
                this.addresses[tx.to].pendingBalance = this.addresses[tx.to].confirmedBalance.plus(new BigNumber(tx.value));
            }

            if (!this.addresses[tx.from].pendingBalance.isZero()) {
                this.addresses[tx.from].pendingBalance = this.addresses[tx.from].pendingBalance.minus(new BigNumber(tx.value).plus(tx.fee));
            } else {
                this.addresses[tx.from].pendingBalance = this.addresses[tx.from].confirmedBalance.minus(new BigNumber(tx.value).plus(tx.fee));
            }
        });
    }

    calculateMinerReward() {
        let base_reward = new BigNumber(5000000);
        let fees_sum = new BigNumber(0);
        this.pendingTransactions.forEach(transaction => {
            fees_sum = fees_sum.plus(transaction.fee);
        });
        return base_reward.plus(fees_sum).toString();
    }

    filterTransactions() {
        let transactions = [];
        this.pendingTransactions.forEach((pTx) => {
            if (transactions.find((tx) => tx.from === pTx.from)) return;
            transactions.push(pTx);
        });
        return transactions;
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
                ...this.filterTransactions(),
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
            confirmedTransactions: this.confirmedTransactions.length,
            pendingTransactions: this.pendingTransactions.length,
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
