const { BigNumber } = require('bignumber.js');

const moment = require('moment');
const Block = require('./Block');
const Transaction = require('./Transaction');
const { sha256 } = require('../utils/hash');
const { request, generateNodeId, address, NewPeerConnected, NewBlock, NewTransaction } = require('../utils/functions');
const Address = require('../models/Address');
/**
 * Represent the blochcain node 
 */
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

    /**
     * Initialize the blockchain and its attributes
     */
    createGenesis() {
        // Blockchain attributes
        // blockchain initialization
        this.blockchain = [];

        // Transactions initialization
        this.pendingTransactions = [];

        this.miningJobs = {};

        // Addresses initialization
        this.addresses = {};
        this.addressesKeys = [];

        this.cumulativeBlockTime = new BigNumber(0);

        // Difficulty initialization
        this.currentDifficulty = process.env.difficulty || 5;
        this.setCumulativeDifficulty();

        //Create genesis block
        let genesisTransactions = Transaction.genesisTransaction();
        let genesisBlock = new Block(0, [genesisTransactions], 0, '0'.repeat(40), null);
        genesisBlock.setMinedData('2019-11-14T23:33:03.915Z', 0,
            sha256(JSON.stringify({ blockDataHash: genesisBlock.blockDataHash, dateCreated: '2019-11-14T23:33:03.915Z', nonce: 0 })));
        this.blockchain.push(genesisBlock);
        this.chainId = this.blockchain[0].blockHash;
        this.newBlockBalances();

    }

    /**
     * iterates over the entire blockchain to calculate the cumulative difficulty
     */
    setCumulativeDifficulty() {
        this.cumulativeDifficulty = new BigNumber(0);
        this.blockchain.forEach((block) => {
            this.cumulativeDifficulty.plus(new BigNumber(16).pow(block.difficulty));
        });
    }

    /**
     * Returns all the confirmed transactions
     * @returns {Transaction[]}
     */
    confirmedTransactions() {
        let confirmedTransactions = [];
        this.blockchain.forEach((block) => {
            confirmedTransactions.push(...block.transactions)
        })
        return confirmedTransactions;
    }

    /**
     * returns an array with confirmed and pending transactions
     * @returns {Transaction[]}
     */
    allTransactions() {
        return this.confirmedTransactions().concat(this.pendingTransactions);
    }

    onNewTransaction(transaction) {
        this.checkPendingBalances();
        Object.keys(this.peers).forEach(peer => {
            request(`${this.peers[peer]}/transactions/send`, 'POST', transaction)
                .catch((error) => {
                    if (!error.status) {
                        delete this.peers[peer];
                    }
                })
        });

    }

    onNewBlock() {
        Object.keys(this.peers).forEach(peer => {
            request(`${this.peers[peer]}/peers/notify-new-block`, 'POST', {
                cumulativeDifficulty: this.cumulativeDifficulty.toString(),
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

    /**
     * Returns true when given cumulative difficulty is greater than curent cumulative difficulty
     * @param {number|string} difficulty 
     */
    shouldDownloadChain(difficulty) {
        return new BigNumber(difficulty).comparedTo(this.cumulativeDifficulty) > 0;
    }

    /**
     * Synchronize with given peer
     * @param {string} peer url of the peer to connect
     */
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

    /**
     * Synchronize pending transactions with the given peer
     * @param {string} peer url of the peer to get transactions
     */
    async synchronizeTransactions(peer) {
        try {
            let resTxs = await request(`${peer}/transactions/pending`);
            this.updateTransactions(resTxs.data.transactions);
            console.log('\x1b[43m%s\x1b[0m', `syncronized with ${peer}`)
        } catch (error) {
            console.log(error)
        }
    }

    /**
     * Synchronize the blockchain with the given peer
     * @param {string} peer url of the peer
     */
    async synchronizeChain(peer) {
        try {
            let res = await request(`${peer}/blocks`);
            if (!this.validateNewChain(res.data)) return;
            this.miningJobs = {};
            NewBlock.emit('new_block');
            console.log('\x1b[43m%s\x1b[0m', `syncronized with ${peer}`)
        } catch (error) {
            console.log(error)
        }
    }

    validateNewChain(chain) {
        let newBalances = {};
        let newCumulativeDifficulty = new BigNumber(0)
        let newCumulativeBlockTime = new BigNumber(0)

        for (let i = 0; i < chain.length; i++) {
            for (let j = 0; j < chain[i].transactions.length; j++) {
                if (!Transaction.isValid(chain[i].transactions[j])) return false;
                Address.checkBalances(newBalances, chain[i].transactions[j], chain.length);

                let index = this.pendingTransactions.findIndex((tx) => tx.transactionDataHash === chain[i].transactions[j].transactionDataHash)

                if (index >= 0) {
                    this.pendingTransactions.splice(index, 1)
                }
            }

            if (i !== 0 && !Block.isValid(chain[i])) {
                return false;
            }

            if (i >= 2) {
                newCumulativeBlockTime = newCumulativeBlockTime.plus(moment(chain[i].dateCreated).diff(chain[i - 1].dateCreated, 'second'));
            }
            newCumulativeDifficulty = newCumulativeDifficulty.plus(new BigNumber(16).pow(chain[i].difficulty))
        }
        this.addresses = newBalances;
        this.blockchain = chain;
        this.cumulativeBlockTime = newCumulativeBlockTime;
        this.cumulativeDifficulty = newCumulativeDifficulty;
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
                transaction.transferSuccessful = this.addresses[transaction.from].hasFunds(new BigNumber(transaction.fee).plus(transaction.value));
            }
            this.pendingTransactions =
                this.pendingTransactions.filter((tx) => tx.transactionDataHash !== transaction.transactionDataHash)
        });
        if (block.index > 1) {
            this.cumulativeBlockTime = this.cumulativeBlockTime.plus(moment(block.dateCreated).diff(this.blockchain[block.index - 1].dateCreated, 'seconds'));
            this.setDifficulty();
        }
        this.addCumulativeDifficulty(block)
        this.blockchain.push(block);

        console.log('\x1b[46m%s\x1b[0m', 'New block mined!');
        this.newBlockBalances();
        this.checkPendingBalances();
        this.sortPendingTransactions()
        NewBlock.emit('new_block');
    }

    addCumulativeDifficulty(block) {
        this.cumulativeDifficulty = this.cumulativeDifficulty.plus(new BigNumber(16).pow(block.difficulty))
    }

    setDifficulty() {
        return
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

    checkPendingBalances() {
        Object.values(this.addresses).forEach((address) => address.pendingBalance = new BigNumber(0));
        this.pendingTransactions.forEach((tx) => {
            const to = tx.to.replace('0x', '');
            const from = tx.from.replace('0x', '');
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

    sortPendingTransactions() {
        this.pendingTransactions = this.pendingTransactions.map((tx) => {
            if (this.addresses[tx.from].hasFunds(tx.fee)) {
                return tx
            }
        });
        this.pendingTransactions.sort((a, b) => {
            if (a.fee > b.fee) {
                return 1
            }
            if (a.fee < b.fee) {
                return -1
            }
            return 0;
        })
    }

    filterTransactions() {
        let transactions = [];
        this.pendingTransactions.forEach((pTx) => {
            if (
                transactions.find((tx) => tx.from.replace('0x', '') === pTx.from.replace('0x', '')) ||
                !this.addresses[pTx.from].hasFunds(new BigNumber(pTx.fee))
            ) return;
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
            chainID: this.chainId,
            currentDifficulty: this.currentDifficulty,
            cumulativeDifficulty: this.cumulativeDifficulty.toString(),
            confirmedTransactions: this.confirmedTransactions().length,
            pendingTransactions: this.pendingTransactions.length,
            peers: this.peers,
        }
    }

    getFullInfo() {
        return {
            peers: this.peers,
            balances: this.addresses,
            chain: {
                chainID: this.chainId,
                blocks: this.blockchain,
                cumulativeDifficulty: this.cumulativeDifficulty.toString(),
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
