const { node } = require('../../index');

class TransactionController {
    static transactionIndex(_, res) {
        return res.send({ message: 'this are all the transactions' });
    }

    static pendingTransactions(_, res) {
        return res.send({ transactions: node.pendingTransactions });
    }

    static confirmedTransactions(_, res) {
        return res.send({ transactions: node.confirmedTransactions });
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