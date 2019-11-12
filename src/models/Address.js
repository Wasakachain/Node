const { BigNumber } = require('bignumber.js');

class Address {
    constructor(address) {
        this.address = address;
        this.safeBalance = new BigNumber(0);
        this.confirmedBalance = new BigNumber(0);
        this.pendingBalance = new BigNumber(0);
    }

    addSafeBalance(value) {
        this.safeBalance.plus(value);
    }

    addConfirmedBalance(value) {
        this.safeBalance.plus(value);
    }

    addPendingBalance(value) {
        this.safeBalance.plus(value);
    }

    substractSafeBalance(value) {
        this.safeBalance.minus(value);
    }

    substractConfirmedBalance(value) {
        this.safeBalance.minus(value);
    }

    substractPendingBalance(value) {
        this.safeBalance.minus(value);
    }

}

export default Address;