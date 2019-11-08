const Blockchain = require('./Blockchain');

class Node {
    constructor() {
        this.blockchain = new Blockchain();
        this.nodeID;
    }

    getAddressesBalances() {
        let addresses = this.blockchain.getAddresses();
        if (addresses) {
            return addresses.filter(({confirmedBalance}) => confirmedBalance !== 0 )
            .map(({ address, safeBalance }) => {
                return {
                    [address]: safeBalance
                };
            });
        }
        return null;
    }
}

module.exports = Node;