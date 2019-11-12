const { sha256, verifySignature } = require('../utils/hash');
const { isValidAddress } = require('../utils/functions');

class Transaction {
    /**
     * Transaction representation class
     * @param {string} from transaction sender address
     * @param {stirng} to transaction receiver address
     * @param {number} value transaction amount
     * @param {number} fee transaction fee
     * @param {string} senderPubKey sender public key
     * @param {Array} senderSignature sender signature
     * @param {number} minedInBlockIndex index of the block where the transaction will be placed
     * @param {boolean} transferSuccessful  
     * @param {boolean} isCoinbase  set to true when transaction is a coinbase transaction
     * @param {string} data transaction data
     */
    constructor(from, to, value, fee, senderPubKey, senderSignature, minedInBlockIndex, data) {
        this.from = from;
        this.to = to;
        this.value = value;
        this.fee = fee;
        this.dateCreated = new Date().toISOString();
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
        if (!isValidAddress(transaction.from) && !isValidAddress(transaction.to)) {
            return false;
        }

        if (Transaction.dataHash(transaction) !== transaction.transactionDataHash) {
            return false;
        }

        return true;

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
            transactionDataHash: Transaction.getTransactionDataHash({
                to, value, fee, data: data ? data.trim() : undefined, minedInBlockIndex, from, senderPubKey, senderSignature, dateCreated
            }),
            senderSignature,
            minedInBlockIndex,
            isCoinbase: true
        }
    }
}

module.exports = Transaction;