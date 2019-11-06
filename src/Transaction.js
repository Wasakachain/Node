const { sha256 } = require('../utils');

const TRANSACTION_STATUS = {
    'pending': 'pending',
    'confirmed': 'confirmed',
};

function Transaction(_from, _to, _value, _fee, _senderPubKey, _data, _senderSignature) {

    let from = _from;
    let to = _to;
    let value = _value;
    let fee = _fee;
    let dateCreated = new Date().toISOString();
    let data = _data;
    let senderPubKey = _senderPubKey;
    let transationDataHash = null;
    let senderSignature = _senderSignature;

    class SingleTransaction {

        constructor() {
            transationDataHash = sha256(JSON.stringify({
                from,
                to,
                value,
                fee,
                dateCreated,
                data,
                senderPubKey,
            }));
        }
        index(req, response) {
            return response.send({ message: 'this are all the transactions' });
        }

        show(req, response) {
            return response.send({ message: `this is the transaction hash number: ${req.params.hash}` });
        }

        pendingTransactions(req, response) {
            return response.send({ message: 'this are all the transactions in pending state' });
        }

        confirmedTransactions(req, response) {
            return response.send({ message: 'this are all the transactions in confirmed state' });
        }

        send(req, response) {
            return response.send({ message: 'transaction done!' });
        }

        addressBalance(req, response) {
            return response.send({ message: `this is the address ${req.params.address} balance` });
        }

        addressTransactions(req, response) {
            return response.send({ message: `this is the address ${req.params.address} transactions` });
        }

        get data() {
            return {
                from,
                to,
                value,
                fee,
                dateCreated,
                data,
                senderPubKey,
                transationDataHash,
                senderSignature,
            }
        }
    }
    return new SingleTransaction();

}
module.exports = Transaction;