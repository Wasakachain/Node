const { node } = require('../../index');
const Transaction = require('../models/Transaction');
const { NewTransaction, paginateTransactions } = require('../utils/functions');

class TransactionController {
    static transactionIndex(request, res) {
        const { responseFormat, paginate } = request.query;
        if (responseFormat) {
            return res.send({
                confirmed: paginateTransactions(node.confirmedTransactions(), { current_page: 1, paginate }),
                pending: paginateTransactions(node.pendingTransactions, { current_page: 1, paginate })
            });
        }
        return res.send({
            message: 'this are all the transactions',
            transactions: [
                ...node.pendingTransactions,
                ...node.confirmedTransactions()
            ]
        });
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
            paginateTransactions(node.confirmedTransactions(), { current_page, paginate })
        );
    }

    static sendTransaction(request, response) {
        const transaction = request.body;
        if (!transaction) {
            return response.status(400).send({ message: 'Transaction data required.' });
        }
        if (!transaction.from || !transaction.to || !transaction.value || !transaction.fee || !transaction.senderPubKey || !transaction.senderSignature || !transaction.transactionDataHash) {
            return response.status(400).send({ message: 'Transaction data missing.', sentTx: transaction });
        }

        const error = Transaction.isInvalidPendingTx(transaction, node);

        if (error) {
            return response.status(400).send({ message: error, sentTx: transaction });
        }

        if ([...node.confirmedTransactions(), ...node.pendingTransactions].find((tx) => tx.transactionDataHash === transaction.transactionDataHash)) {
            return response.status(409).send({ message: 'Transaction already exists', sentTx: transaction });
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
        node.pendingTransactions.push(tx);
        NewTransaction.emit('transaction', tx);
        return response.send({ message: 'transaction done!' });
    }

    static show(req, res) {
        const { hash } = req.params;
        const { responseFormat } = req.query;
        let regex_0x = new RegExp("^0x", "i");
        let hashToFind = '';
        if (regex_0x.test(hash)) {
            hashToFind = hash;
        } else {
            hashToFind = `0x${hash}`;
        }
        if (!/^0x([A-Fa-f0-9]{64})$/.test(hashToFind)) {
            return res
                .status(400)
                .json({ message: 'Invalid transaction hash' })
        }
        let transaction = '';
        if (node.pendingTransactions.length) {
            transaction = [
                ...node.confirmedTransactions(),
                ...node.pendingTransactions,
            ].find(txn => txn.transactionDataHash === hashToFind)
        } else {
            transaction = [
                ...Object.values(node.confirmedTransactions())
            ].find(txn => txn.transactionDataHash === hashToFind)
        }

        if (transaction) {
            if (responseFormat) {
                return res.status(200).send({ transaction })
            }
            return res.status(200).json(transaction)
        }

        return res
            .status(404)
            .json({ message: 'Transaction not found' })
    }
}

module.exports = TransactionController;
