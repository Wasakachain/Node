const { node } = require('../../index');

class AddressController {
    static balances(_, response) {
        let addressesInfo = node.getAddressesSafeBalances();
        if (addressesInfo) {
            return response.send({ addressesBalances: addressesInfo });
        }
        return response.status(404).send({ message: 'No Addresses Found' })
    }

    static addressBalance(req, response) {
        const { address } = req.params;
        if (node.getAddress(address)) {
            return response.json({ data: node.getAddress(address) });
        }
        return response.status(404).send({ message: `No balance found for address ${address}` });
    }

    static addressTransactions(req, response) {
        const { address } = req.params;

        let transactions = [...node.confirmedTransactions(), ...node.pendingTransactions]
            .filter((transaction) => transaction.from === address || transaction.to === address);

        if (!transactions.length > 0) {
            return response.status(404).send({ address, message: 'No transactions found for address' });
        }

        return response.send({ address, transactions });
    }
}

module.exports = AddressController;