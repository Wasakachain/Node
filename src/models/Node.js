const { BigNumber } = require('bignumber.js');

const moment = require('moment');
const Block = require('./Block');
const Transaction = require('./Transaction');
const { request, generateNodeId, address, NewPeerConnected, NewBlock, NewTransaction } = require('../utils/functions');
const Address = require('../models/Address');

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

        this.cumulativeBlockTime = new BigNumber(0);

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
        this.checkPendingBalances();

        Object.keys(this.peers).forEach(peer => {
            request(`${this.peers[peer]}/transactions/send`, 'POST', transaction)
                .catch((error) => {
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
        this.cumulativeBlockTime = new BigNumber(0);

        for (let i = 0; i < chain.length; i++) {
            for (let j = 0; j < chain[i].transactions.length; j++) {
                if (!Transaction.isValid(chain[i].transactions[j])) return false;
                Address.checkBalances(newBalances, chain[i].transactions[j], chain.length);
            }

            if (i !== 0 && !Block.isValid(chain[i])) {
                return false;
            }

            if (i !== 2) {
                this.cumulativeBlockTime = this.cumulativeBlockTime.plus(moment(chain[i].dateCreated).diff(chain[i - 1].dateCreated, 'second'));
            }
        }
        this.addresses = newBalances;
        this.blockchain = chain;
        this.setDifficulty()
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
        block.transactions.forEach((transaction) => {
            transaction.minedInBlockIndex = block.index;
            if (!transaction.isCoinbase) {
                transaction.tansferSuccessful = this.addresses[transaction.from].hasFunds(transaction.fee, this.pendingTransactions);
            }
            this.confirmedTransactions = [
                ...this.confirmedTransactions,
                transaction
            ];
            this.pendingTransactions =
                this.pendingTransactions.filter((tx) => tx.transactionDataHash !== transaction.transactionDataHash)
        });
        if (block.index > 1) {
            this.cumulativeBlockTime = this.cumulativeBlockTime.plus(moment(block.dateCreated).diff(this.blockchain[block.index - 1].dateCreated, 'seconds'));
            this.setDifficulty();
        }

        this.blockchain.push(block);
        this.addCumulativeDifficulty(block.difficulty);
        console.log('\x1b[46m%s\x1b[0m', 'New block mined!');
        NewBlock.emit('new_block');
        this.newBlockBalances();
        this.checkPendingBalances(true);
    }

    addCumulativeDifficulty(blockDifficulty) {
        this.cumulativeDifficulty = this.cumulativeDifficulty.plus(new BigNumber(16).pow(blockDifficulty))
    }

    setDifficulty() {
        let average = this.cumulativeBlockTime.dividedBy(this.blockchain.length);
        if (average.comparedTo(10) < 0) {
            this.currentDifficulty++;
        } else if (this.currentDifficulty > 1) {
            this.currentDifficulty--;
        }
    }

    updateTransactions(nodeTransactions) {
        let newTransactions = {};
        [...this.pendingTransactions, ...nodeTransactions].forEach((transaction) => {
            if (newTransactions[transaction.transactionDataHash]) {
                return;
            }
            newTransactions[transaction.transactionDataHash] = transaction;
        });

        this.pendingTransactions = Object.values(newTransactions);
    }

    checkPendingBalances(message) {
        Object.values(this.addresses).forEach((address) => address.pendingBalance = new BigNumber(0));
        this.pendingTransactions.forEach((tx) => {
            const to = tx.to.replace('0x', 0);
            const from = tx.from.replace('0x', 0);
            if (!this.addresses[to]) {
                this.addresses[to] = new Address(to);
            }

            if (!this.addresses[to].pendingBalance.isZero()) {
                this.addresses[to].pendingBalance = this.addresses[to].pendingBalance.plus(new BigNumber(tx.value));

            } else {
                this.addresses[to].pendingBalance = this.addresses[to].confirmedBalance.plus(new BigNumber(tx.value));
            }

            if (!this.addresses[from].pendingBalance.isZero()) {
                this.addresses[from].pendingBalance = this.addresses[from].pendingBalance.minus(new BigNumber(tx.value).plus(tx.fee));
            } else {
                this.addresses[from].pendingBalance = this.addresses[from].confirmedBalance.minus(new BigNumber(tx.value).plus(tx.fee));
            }
        });
    }

    calculateMinerReward(blockTransactions) {
        let base_reward = new BigNumber(5000000);
        let fees_sum = new BigNumber(0);
        blockTransactions.forEach(transaction => {
            fees_sum = fees_sum.plus(transaction.fee);
        });
        return base_reward.plus(fees_sum).toString();
    }

    filterTransactions() {
        let transactions = [];
        this.pendingTransactions.forEach((pTx) => {
            if (transactions.find((tx) => tx.from === pTx.from) ||
                !this.addresses[pTx.from].hasFunds(new BigNumber(pTx.value).plus(pTx.fee))) return;
            pTx.minedInBlockIndex =
                transactions.push(pTx);
        });
        return transactions;
    }

    newMiningJob(minerAddress, difficulty) {
        let blockTransactions = this.filterTransactions();
        const candidateBlock = new Block(
            this.blockchain.length,
            [
                Transaction.coinbaseTransaction(
                    minerAddress, this.calculateMinerReward(blockTransactions),
                    0,
                    this.blockchain.length
                ),
                ...blockTransactions,
            ],
            difficulty || this.currentDifficulty,
            minerAddress,
            this.blockchain[this.blockchain.length - 1].blockHash,
        );
        this.miningJobs[candidateBlock.blockDataHash] = candidateBlock;

        return {
            index: this.blockchain.length,
            transactionsIncluded: candidateBlock.transactions.length,
            difficulty: this.currentDifficulty,
            expectedReward: this.calculateMinerReward(candidateBlock.transactions),
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
            currentDifficulty: this.currentDifficulty,
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
        const cleanAddress = address.replace('0x', '');
        if (this.addresses[cleanAddress]) {
            return this.addresses[cleanAddress];
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
            let addressWithConfirmedBalance = {};
            Object.keys(addresses).forEach(addressHash => {
                let { confirmedBalance } = addresses[addressHash];
                if (parseInt(confirmedBalance) !== 0) {
                    addressWithConfirmedBalance[addressHash] = { confirmedBalance: parseInt(confirmedBalance) };
                }
            })
            return addressWithConfirmedBalance ? addressWithConfirmedBalance : null;
        }
        return null;
    }
}

module.exports = Node;
