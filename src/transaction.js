const { sha256 } = require('../utils');
const TRANSACTION_STATUS = {
    'pending': 'pending',
    'confirmed': 'confirmed',
};

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

    __index(req, response) {
        return response.send({ message: 'this are all the transactions' });
    }

    __show(req, response) {
        return response.send({ message: `this is the transaction hash number: ${req.params.hash}` });
    }

    __pendingTransactions(req, response) {
        return response.send({ message: 'this are all the transactions in pending state' });
    }

    __confirmedTransactions(req, response) {
        return response.send({ message: 'this are all the transactions in confirmed state' });
    }

    __send(req, response) {
        return response.send({ message: 'transaction done!' });
    }

    __addressBalance(req, response) {
        return response.send({ message: `this is the address ${req.params.address} balance` });
    }

    __addressTransactions(req, response) {
        return response.send({ message: `this is the address ${req.params.address} transactions` });
    }
}

module.exports = Transaction;