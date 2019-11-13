const { BigNumber } = require('bignumber.js');

class Address {
    constructor(address) {
        this.address = address;
        this.safeBalance = new BigNumber(0);
        this.confirmedBalance = new BigNumber(0);
        this.pendingBalance = new BigNumber(0);
    }

    static checkBalances(blockchain) {
        let balances = {};
        blockchain.forEach(({ transactions }) => {
            transactions.forEach((tx) => {
                if (!balances[tx.from]) {
                    balances[tx.from] = new Address(tx.from);
                }
                if (!balances[tx.to]) {
                    balances[tx.to] = new Address(tx.to);
                }
                balances[tx.from].substractSafeBalance(tx.value + tx.fee)
                balances[tx.to].addSafeBalance(tx.value + tx.fee)
            });
        });

        return {
            balances,
            balancesKeys: Object.keys(balances),
        };
    }

    hasFunds(amount) {
        return (this.safeBalance.plus(this.confirmedBalance)).comparedTo(amount) > 0;
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