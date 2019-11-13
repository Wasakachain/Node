const { BigNumber } = require('bignumber.js');

class Address {
    constructor(address) {
        this.address = address;
        this.safeBalance = new BigNumber(0);
        this.confirmedBalance = new BigNumber(0);
        this.pendingBalance = new BigNumber(0);
    }

    static checkBalances(addresses, tx, blockIndex, blockchainLength) {
        if (!addresses[tx.to]) {
            addresses[tx.to] = new Address(tx.to)
        }

        if (!addresses[tx.from]) {
            addresses[tx.from] = new Address(tx.from)
        }

        // if ((blockchainLength - blockIndex) > 6) {
        // addresses[tx.to].safeBalance = addresses[tx.to].safeBalance.plus(tx.value);
        // } else {
        addresses[tx.to].confirmedBalance = addresses[tx.to].confirmedBalance.plus(tx.value);
        // }

        const amount = new BigNumber(tx.value + tx.fee);

        // if (addresses[tx.from].safeBalance.comparedTo(amount) < 0) {

        //     addresses[tx.from].confirmedBalance =
        //         addresses[tx.from].confirmedBalance.minus(
        //             amount.minus(addresses[tx.from].safeBalance)
        //         );

        //     addresses[tx.from].safeBalance = new BigNumber(0);

        // }

        addresses[tx.from].confirmedBalance = addresses[tx.from].confirmedBalance.minus(amount);
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