const Blockchain = require('./Blockchain');
const {generateNodeId, address} = require('../utils/functions');

class Node {
    constructor() {
        this.generateNodeId = this.generateNodeId.bind(this);
        this.generateNodeId();
        this.generateWasakaChain();
        this.nodeID;
    }

    index() {
        let blockchainData = this.blockchain.getInfo();
        return {
            about: 'WasakaChain Blockchain Node',
            nodeID: this.nodeID,
            nodeUrl: address(),
            peers: this.peers,
            ...blockchainData
        }
    }

    async generateNodeId() {
        this.nodeID = await generateNodeId();
    }

    getAddressesBalances() {
        let addresses = this.blockchain.getAddresses();
        if (addresses) {
            return addresses.filter(({ confirmedBalance }) => confirmedBalance !== 0)
                .map(({ address, safeBalance }) => {
                    return {
                        [address]: safeBalance
                    };
                });
        }
        return null;
    }

    generateWasakaChain() {
        return this.blockchain = new Blockchain();
    }
}

module.exports = Node;