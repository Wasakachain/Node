const { sha256, verifySignature } = require('../utils/hash');
const { isValidAddress } = require('../utils/functions');
class Transaction {
    constructor(from, to, value, fee, senderPubKey, data, senderSignature, minedInBlockIndex, transferSuccessful = false) {
        this.from = from;
        this.to = to;
        this.value = value;
        this.fee = fee;
        this.dateCreated = new Date().toISOString();
        this.data = data;
        this.senderPubKey = senderPubKey;
        this.transactionDataHash = sha256(JSON.stringify({
            from,
            to,
            value,
            fee,
            dateCreated: this.dateCreated,
            data,
            senderPubKey,
        }));

        this.senderSignature = senderSignature;
        this.minedInBlockIndex = minedInBlockIndex;
        this.transferSuccessful = transferSuccessful;

    }

    verify() {
        return verifySignature(this.transactionDataHash, this.senderPubKey, this.senderSignature);
    }

    static isValid(transaction) {
        //TO DO: COMPLETE THIS METHOD
        if (!isValidAddress(transaction.from) && !isValidAddress(transaction.to)) {
            return false;
        }

        if (Transaction.isValid(transaction) !== transaction.transactionDataHash) {
            return false;
        }

        return true;

    }

    getData() {
        return {
            from,
            to,
            value,
            fee,
            dateCreated,
            data,
            senderPubKey,
            transactionDataHash,
            senderSignature,
            minedInBlockIndex,
            transferSuccessful
        }
    }

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

    static coinbaseTransaction({ to, value, fee, data, minedInBlockIndex }) {
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
                to, value, fee, data: data.trim(), minedInBlockIndex, from, senderPubKey, senderSignature, dateCreated
            }),
            senderSignature,
            minedInBlockIndex
        }
    }
}

module.exports = Transaction;
/*
const { sha256 } = require('../utils/hashes');

const TRANSACTION_STATUS = {
    'pending': 'pending',
    'confirmed': 'confirmed',
};

class Transaction {
    constructor({ from, to, value, fee, senderPubKey, data, senderSignature, minedInBlockIndex }) {
        this.from = from;
        this.to = to;
        this.value = value;
        this.fee = fee;
        this.senderPubKey = senderPubKey;
        this.data = data.trim();
        this.senderSignature = senderSignature;
        this.dateCreated = new Date().toISOString();
        this.minedInBlockIndex = minedInBlockIndex;

    }

    getData() {
        const { from, to, value, fee, data, dateCreated, senderPubKey, senderSignature } = this;


        return {
            from,
            to,
            value,
            fee,
            dateCreated: dateCreated,
            ...Object.assign({}, data ? { data } : {}),
            senderPubKey,
            transactionDataHash: Transaction.getTransactionDataHash(this),
            senderSignature
        }
    }

    static getTransactionDataHash({ from, to, value, fee, data, dateCreated, senderPubKey }) {
        return sha256(JSON.stringify({
            from,
            to,
            value,
            fee,
            dateCreated,
            ...Object.assign({}, data ? { data } : {}),
            senderPubKey,
        }))
    }

    static getCoinbaseTransaction({ to, value, fee, data, minedInBlockIndex }) {
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
                to, value, fee, data: data.trim(), minedInBlockIndex, from, senderPubKey, senderSignature, dateCreated
            }),
            senderSignature,
            minedInBlockIndex
        }
    }
}

module.exports = Transaction; */