const { sha256, verifySignature } = require('../utils/hash');
const { isValidAddress } = require('../utils/functions');
const { node } = require('../../index');
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
     * @param {boolean} transferSuccessful  
     * @param {string} data transaction data
     */
    constructor(from, to, value, fee, dateCreated, senderPubKey, senderSignature, minedInBlockIndex, data) {
        this.from = from;
        this.to = to;
        this.value = value;
        this.fee = fee;
        this.dateCreated = isNaN(Date.parse(dateCreated)) ? new Date().toISOString() : dateCreated;
        this.data = data;
        this.senderPubKey = senderPubKey;
        this.transactionDataHash = Transaction.dataHash({ from, to, value, fee, dateCreated: this.dateCreated, senderPubKey });
        this.senderSignature = senderSignature;
        this.minedInBlockIndex = minedInBlockIndex;
        this.transferSuccessful = transferSuccessful;
    }

    /**
     * returns true when the transaction has a valid signature
     * @returns {boolean}
     */
    verify() {
        return verifySignature(this.transactionDataHash, this.senderPubKey, this.senderSignature);
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
    static isInvalidPendingTx(pendingTx) {
        if (!isValidAddress(pendingTx.to)) {
            return 'Invalid "to" address.';
        }
        if (!isValidAddress(pendingTx.from)) {
            return 'Invalid "from" address.';
        }
        if (Transaction.dataHash(pendingTx) !== pendingTx.transactionDataHash) {
            return 'Invalid transaction hash.';
        }
        if(!Array.isArray(pendingTx.senderSignature) || pendingTx.senderSignature.length !== 2) {
            return 'Invalid transaction signature.'
        }
        if(!pendingTx.verify()) {
            return 'Transaction signature verification failed.'
        }
        if(isNaN(Date.parse(pendingTx.dateCreated)) || Date.parse(node.blockchain[0].dateCreated) >= Date.parse(pendingTx.dateCreated) || (Date.now() < Date.parse(pendingTx.dateCreated))) {
            return 'Invalid creation date.';
        }
        if(!node.getAddress(pendingTx.from)) {
            return 'The sender address doesn\'t the funds.';
        }
        if(typeof pendingTx.value !== "string") {
            return 'The transaction\'s value must be a string.';
        }
        const value = new BigNumber(pendingTx.value);
        const fee = new BigNumber(pendingTx.fee);
        if(value.isNaN() || fee.isNaN() || !value.isInteger() || !fee.isInteger()) {
            return 'The transaction\'s value and fee must be valid integer numbers.';
        }
        if(!node.getAddress(pendingTx.from).hasFunds(value.plus(fee))) {
            return 'The sender address doesn\'t the funds.';
        }
        return false;
    }

    /**
     * Calculate the data hash of the given transaction and return it
     * @param {Transaction}  transaction
     */
    static dataHash({ from, to, value, fee, dateCreated, data, senderPubKey }) {
        return sha256(JSON.stringify({
            from,
            to,
            value,
            fee,
            dateCreated,
            data,
            senderPubKey,
        }))
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