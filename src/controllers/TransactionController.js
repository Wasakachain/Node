const { node } = require('../../index');
const { paginateTransactions } = require('../utils/functions');

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

    static sendTransaction(_, res) {
        return res.send({ message: 'transaction done!' });
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