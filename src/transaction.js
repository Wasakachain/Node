const { sha256 } = require('../utils');

class Transaction {
    constructor(from, to, value, fee, dateCreated, data, senderPubKey) {
        this.from = from;
        this.to = to;
        this.value = value;
        this.fee = fee;
        this.dateCreated = dateCreated;
        this.data = data;
        this.senderPubKey = senderPubKey;
    }
}

module.exports = Transaction;