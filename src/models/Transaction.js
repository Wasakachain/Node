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

    verify() {
        return verifySignature(this.transactionDataHash, this.senderPubKey, this.senderSignature);
    }
}

module.exports = Transaction;