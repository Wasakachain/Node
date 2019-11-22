const { node } = require('../../index');
const { isValidAddress } = require('../utils/functions');

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

    static addressBalances(req, response) {
        const { addresses } = req.body;
        if(!Array.isArray(addresses)) {
            return response.status(404).json({ error:{ message: 'addresses\'s array required.' } });
        }
        let addressesBalance = {};
        for(let i = 0; i < addresses.length; i++) {
            let address = isValidAddress(addresses[i]);
            if(!address) {
                return response.status(404).json({ error:{ message: `invalid address "${addresses[i]}".` } });
            }
            if (node.getAddress(address)) {
                addressesBalance[address] = node.getAddress(address).getBalance();
                addressesBalance[address].address = address;
            } else {
                addressesBalance[address] = {
                    address,    
                    safeBalance: '0',
                    confirmedBalance: '0',
                    pendingBalance: '0',
                };
            }
        }
        return response.send({ data: addressesBalance });
    }

    static addressTransactions(req, response) {
        let { address } = req.params;
        if (isValidAddress(address)) {
            address = isValidAddress(address);
            let transactions = [...node.confirmedTransactions(), ...node.pendingTransactions]
                .filter((transaction) => transaction.from === address || transaction.to === address);
            if (!transactions.length > 0) {
                return response.status(404).send({ address, message: 'No transactions found for address' });
            }
            return response.send({ address, transactions });
        }
        else {
            return response.status(400).send({ address, message: 'Not valid Address' });
        }

    }
}

module.exports = AddressController;
