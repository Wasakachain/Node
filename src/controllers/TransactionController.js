const { node } = require('../../index');

class TransactionController {
    static transactionIndex(request, response) {
        return response.send({ message: 'this are all the transactions' });
    }

    static pendingTransactions(_, response) {
        return response.send({ transactions: node.pendingTransactions });
    }

    static confirmedTransactions(_, response) {
        return response.send({ transactions: node.confirmedTransactions });
    }

    static send(_, response) {
        return response.send({ message: 'transaction done!' });
    }

    static show(request, response) {
        const { hash } = request.params;

        if (!/^0x([A-Fa-f0-9]{64})$/.test(hash)) {
            return response
                .status(400)
                .json({ message: 'Invalid transaction hash' })
        }

        let transaction = [...node.confirmedTransactions
            , ...node.pendingTransactions]
            .find(txn => txn.transactionDataHash === hash)

        if (transaction) return response.status(200).json(transaction)

        return response
            .status(404)
            .json({ message: 'Transaction not found' })
    }
}

module.exports = TransactionController;