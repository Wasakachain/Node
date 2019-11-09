const { sha256 } = require('../utils/hash');
const { verifySignature } = require('../utils/hash');

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

    verify() {
        return verifySignature(this.transactionDataHash, this.senderPubKey, this.senderSignature);
    }
}

module.exports = Transaction;