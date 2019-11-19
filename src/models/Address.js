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
        const to = tx.to.replace('0x', '');
        const from = tx.from.replace('0x', '');
        if (!addresses[to]) {
            addresses[to] = new Address(to)
        }

        if (!addresses[from] && !tx.isCoinbase) {
            addresses[from] = new Address(from)
        }

        if (!tx.transferSuccessful && !tx.isCoinbase) {
            const amount = new BigNumber(tx.fee);
            addresses[tx.from].confirmedBalance = addresses[tx.from].confirmedBalance.minus(amount);
            return
        }

        if (!tx.isCoinbase) {
            const amount = new BigNumber(tx.value + tx.fee);
            if (addresses[tx.from].safeBalance.comparedTo(amount) <= 0) {
                addresses[tx.from].safeBalance = new BigNumber(0);
            } else {
                addresses[from].safeBalance = addresses[from].safeBalance.minus(amount);
            }
        }

        if ((blockchainLength - tx.minedInBlockIndex) > 6) {
            addresses[tx.to].safeBalance = addresses[tx.to].safeBalance.plus(tx.value);
        }

        addresses[tx.to].confirmedBalance = addresses[tx.to].confirmedBalance.plus(tx.value);
    }

    hasFunds(amount, pendingTransactions) {
        if (pendingTransactions.find((tx) => tx.from.replace('0x', '') === this.address)) {
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

    getBalance() {
        return {
            safeBalance: this.safeBalance.toString(),
            confirmedBalance: this.confirmedBalance.toString(),
            pendingBalance: this.pendingBalance.toString(),
        }
    }
}

module.exports = Address;