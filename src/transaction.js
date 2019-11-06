const TRANSACTION_STATUS = {
    'pending': 'pending',
    'confirmed': 'confirmed',
};

class Transaction {
    constructor(sender, recipient, amount) {
        this.sender = sender;
        this.recipient = recipient;
        this.amount = amount;
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