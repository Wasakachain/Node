const Blockchain = require('./Blockchain');

class Node {
    constructor() {
        this.blockchain = new Blockchain();
        this.nodeID;
    }

    getAddressesBalances() {
        let addresses = this.blockchain.getAddresses();
        if (addresses) {
            return addresses.map(({ address, safeBalance }) => {
                return {
                    [address]: safeBalance
                };
            });
        }
        return null;
    }
}

module.exports = Node;