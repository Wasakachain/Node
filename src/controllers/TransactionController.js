const { node } = require('../../index');
const Transaction = require('../models/Transaction');
const { NewTransaction, paginateTransactions } = require('../utils/functions');

class TransactionController {
    static transactionIndex(_, res) {
        return res.send({ message: 'this are all the transactions' });
    }

    static pendingTransactions(req, response) {
        const { current_page, paginate } = req.query;
        return response.send(
            paginateTransactions(node.pendingTransactions, { current_page, paginate })
        );
    }

    static confirmedTransactions(req, response) {
        const { current_page, paginate } = req.query;
        return response.send(
            paginateTransactions(node.confirmedTransactions, { current_page, paginate })
        );
    }

    static sendTransaction(request, response) {
        const { transaction } = request.params;
        if(!transaction) {
            return response.status(400).send({message: 'Transaction data required.'});
        }
        if(!transaction.from || !transaction.to || !transaction.value || !transaction.fee || !transaction.senderPubKey || !transaction.senderSignature) {
            return response.status(400).send({message: 'Transaction data missing.', sentTx: transaction});
        }
        const error = Transaction.isInvalidPendingTx(transaction);
        if(error) {
            return response.status(400).send({message: error, sentTx: transaction});
        }
        const tx = new Transaction(
            transaction.from, 
            transaction.to, 
            transaction.value, 
            transaction.fee, 
            transaction.dateCreated, 
            transaction.senderPubKey, 
            transaction.senderSignature, 
            null, 
            transaction.data
        );
        node.pendingTransactions[tx.transactionDataHash] = tx;
        node.pendingTransactionsKeys.push(tx.transactionDataHash);

        NewTransaction.emit('transaction', tx);

        return response.send({ message: 'transaction done!' });
    }

    static show(req, res) {
        const { hash } = req.params;

        if (!/^0x([A-Fa-f0-9]{64})$/.test(hash)) {
            return res
                .status(400)
                .json({ message: 'Invalid transaction hash' })
        }

        let transaction = [...node.confirmedTransactions
            , ...node.pendingTransactions]
            .find(txn => txn.transactionDataHash === hash)

        if (transaction) return res.status(200).json(transaction)

        return res
            .status(404)
            .json({ message: 'Transaction not found' })
    }
}

module.exports = TransactionController;
