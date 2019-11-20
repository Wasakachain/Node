const { sha256, verifySignature } = require('../utils/hash');
const { isValidAddress } = require('../utils/functions');
const Address = require('./Address');
const BigNumber = require('bignumber.js');
class Transaction {
    /**
     * Transaction representation class
     * @param {string} from transaction sender address
     * @param {stirng} to transaction receiver address
     * @param {number} value transaction amount
     * @param {number} fee transaction fee
     * @param {string} dateCreated trasaction creation date
     * @param {string} senderPubKey sender public key
     * @param {Array} senderSignature sender signature
     * @param {number} minedInBlockIndex index of the block where the transaction will be placed
     * @param {string} data transaction data
     * @param {boolean} transferSuccessful  
     */
    constructor(from, to, value, fee, dateCreated, senderPubKey, senderSignature, minedInBlockIndex, data, transferSuccessful = true) {
        this.from = from;
        this.to = to;
        this.value = value;
        this.fee = fee;
        this.dateCreated = isNaN(Date.parse(dateCreated)) ? new Date().toISOString() : dateCreated;
        this.data = data ? data : undefined;
        this.senderPubKey = senderPubKey;
        this.transactionDataHash = Transaction.dataHash({ from, to, value, fee, dateCreated: isNaN(Date.parse(dateCreated)) ? new Date().toISOString() : dateCreated, data, senderPubKey });
        this.senderSignature = senderSignature;
        this.minedInBlockIndex = minedInBlockIndex;
        this.transferSuccessful = transferSuccessful;
    }

    static getDataForHash(tx) {
        const { from, to, value, fee, dateCreated, data, senderPubKey } = tx
        return {
            from,
            to,
            value,
            fee,
            dateCreated,
            data,
            senderPubKey,
        }
    }

    /**
     * returns true when the transaction has a valid signature
     * @returns {boolean}
     */
    static verifyTransaction(transaction) {
        return verifySignature(transaction.transactionDataHash.replace('0x', ''), transaction.senderPubKey, transaction.senderSignature);
    }

    /**
     * returns true when the transaction has a valid signature
     * @returns {boolean}
     */
    verify() {
        return verifySignature(this.transactionDataHash.replace('0x', ''), this.senderPubKey, this.senderSignature);
    }

    /**
     * returns true when the given transaction is a valid transaction
     * @param {Transaction} transaction transaction to check
     */
    static isValid(transaction) {
        //TO DO: COMPLETE THIS METHOD
        if (transaction.fee < 10 && !transaction.isCoinbase) {
            return false;
        }

        if (!isValidAddress(transaction.from) && !isValidAddress(transaction.to)) {
            return false;
        }

        if (Transaction.dataHash(transaction) !== transaction.transactionDataHash) {
            return false;
        }

        return true;
    }

    /**
     * returns true when the given transaction is a valid pending transaction
     * @param {Transaction} transaction transaction to check
     */
    static isInvalidPendingTx(pendingTx, node) {
        if (!isValidAddress(pendingTx.to)) {
            return 'Invalid "to" address.';
        }
        if (!isValidAddress(pendingTx.from)) {
            return 'Invalid "from" address.';
        }
        if (Transaction.dataHash(pendingTx).replace('0x', '') !== pendingTx.transactionDataHash.replace('0x', '')) {
            return 'Invalid transaction hash.';
        }
        if (!Array.isArray(pendingTx.senderSignature) || pendingTx.senderSignature.length !== 2) {
            return 'Invalid transaction signature.'
        }
        if (!Transaction.verifyTransaction(pendingTx)) {
            return 'Transaction signature verification failed.'
        }

        if (pendingTx.fee < 10) {
            return 'The minimum fee is 10'
        }

        if (isNaN(Date.parse(pendingTx.dateCreated)) || Date.parse(node.blockchain[0].dateCreated) >= Date.parse(pendingTx.dateCreated) || (Date.parse(pendingTx.dateCreated) - Date.now()) > 60 * 1000) {
            return 'Invalid creation date.';
        }
        if (!node.getAddress(pendingTx.from)) {
            return 'The sender address doesn\'t the funds.';
        }

        if (typeof pendingTx.value !== "string") {
            return 'The transaction\'s value must be a string.';
        }
        const value = new BigNumber(pendingTx.value);
        const fee = new BigNumber(pendingTx.fee);

        if (value.isNaN() || fee.isNaN() || !value.isInteger() || !fee.isInteger()) {
            return 'The transaction\'s value and fee must be valid integer numbers.';
        }
        if (!node.getAddress(pendingTx.from).hasFunds(value.plus(fee), node.pendingTransactions)) {
            return 'The sender address doesn\'t the funds.';
        }
        return false;
    }

    /**
     * Calculate the data hash of the given transaction and return it
     * @param {Transaction}  transaction
     */
    static dataHash({ from, to, value, fee, dateCreated, data, senderPubKey }) {
        return `${sha256(JSON.stringify({
            from,
            to,
            value,
            fee,
            dateCreated,
            data: data ? data : undefined,
            senderPubKey,
        }))}`
    }

    static genesisTransaction() {
        const from = '0000000000000000000000000000000000000000',
            senderPubKey = '00000000000000000000000000000000000000000000000000000000000000000',
            senderSignature = [
                '0000000000000000000000000000000000000000000000000000000000000000',
                '0000000000000000000000000000000000000000000000000000000000000000'
            ],
            to = 'f88b3515440b9fa31579f53eb750f16380f01801',
            data = 'Genesis tx',
            value = '1000000000',
            dateCreated = new Date().toISOString();

        return {
            from,
            to,
            value,
            fee: 0,
            dateCreated: dateCreated,
            data,
            senderPubKey,
            transactionDataHash: Transaction.dataHash({
                to, value, fee: 0, data, minedInBlockIndex: 0, from, senderPubKey, senderSignature, dateCreated
            }),
            senderSignature,
            minedInBlockIndex: 0,
            isCoinbase: true
        }
    }

    /**
     * Create a coinbase transaction
     * @param {string} to address of transaction receiver
     * @param {number} value transaction amount
     * @param {number} fee transaction fee
     * @param {number} minedInBlockIndex index of the block where the transaction will be placed
     * @param {string} data transaction data
     */
    static coinbaseTransaction(to, value, fee, minedInBlockIndex, data) {
        const from = '0000000000000000000000000000000000000000',
            senderPubKey = '00000000000000000000000000000000000000000000000000000000000000000',
            senderSignature = [
                '0000000000000000000000000000000000000000000000000000000000000000',
                '0000000000000000000000000000000000000000000000000000000000000000'
            ],
            dateCreated = new Date().toISOString();

        return {
            from,
            to,
            value,
            fee,
            dateCreated: dateCreated,
            ...Object.assign({}, data ? { data: data.trim() } : {}),
            senderPubKey,
            transactionDataHash: Transaction.dataHash({
                to, value, fee, data: data ? data.trim() : undefined, minedInBlockIndex, from, senderPubKey, senderSignature, dateCreated
            }),
            senderSignature,
            minedInBlockIndex,
            isCoinbase: true
        }
    }
}

module.exports = Transaction;
