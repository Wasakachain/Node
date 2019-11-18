const { BigNumber } = require('bignumber.js');

class Address {
    constructor(address) {
        this.address = address;
        this.safeBalance = new BigNumber(0);
        this.confirmedBalance = new BigNumber(0);
        this.pendingBalance = new BigNumber(0);
    }

    /**
     * 
     * @param {Array} addresses addresses object of the node
     * @param {Transaction} tx transaction to examine
     * @param {number} blockchainLength blockchain length
     */
    static checkBalances(addresses, tx, blockchainLength) {
        if (!addresses[tx.to]) {
            addresses[tx.to] = new Address(tx.to)
        }

        if (!addresses[tx.from] && !tx.isCoinbase) {
            addresses[tx.from] = new Address(tx.from)
        }

        if ((blockchainLength - tx.minedInBlockIndex) > 6) {
            addresses[tx.to].safeBalance = addresses[tx.to].safeBalance.plus(tx.value);
        }

        addresses[tx.to].confirmedBalance = addresses[tx.to].confirmedBalance.plus(tx.value);

        const amount = new BigNumber(tx.value + tx.fee);

        if (!tx.isCoinbase) {
            addresses[tx.from].confirmedBalance = addresses[tx.from].confirmedBalance.minus(amount);

            if (addresses[tx.from].safeBalance.comparedTo(amount) <= 0) {
                addresses[tx.from].safeBalance = new BigNumber(0);
            } else {
                addresses[tx.from].safeBalance = addresses[tx.from].safeBalance.minus(amount);
            }
        }
    }

    hasFunds(amount, pendingTransactions) {
        if (pendingTransactions.find((tx) => tx.from === this.address)) {
            return this.confirmedBalance.comparedTo(amount) >= 0 && this.pendingBalance.comparedTo(amount) >= 0;
        }
        return this.confirmedBalance.comparedTo(amount) >= 0;
    }

    addSafeBalance(value) {
        this.safeBalance = this.safeBalance.plus(value);
    }

    addConfirmedBalance(value) {
        this.confirmedBalance = this.confirmedBalance.plus(value);
    }

    addPendingBalance(value) {
        this.pendingBalance = this.pendingBalance.plus(value);
    }

    substractSafeBalance(value) {
        this.safeBalance = this.safeBalance.minus(value);
    }

    substractConfirmedBalance(value) {
        this.confirmedBalance = this.confirmedBalance.minus(value);
    }

    substractPendingBalance(value) {
        this.pendingBalance = this.pendingBalance.minus(value);
    }

}

module.exports = Address;