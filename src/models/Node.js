const Blockchain = require('./Blockchain');
const {generateNodeId, address} = require('../utils/functions');

class Node {
    constructor() {
        this.generateNodeId = this.generateNodeId.bind(this);
        this.getNodeInfo = this.getNodeInfo.bind(this);
        this.generateNodeId();
        this.generateWasakaChain();
        this.nodeID;
    }

    index() {
        let blockchainData = this.blockchain.getGeneralInfo();
        return {
            about: 'WasakaChain Blockchain Node',
            nodeID: this.nodeID,
            nodeUrl: address(),
            ...blockchainData
        }
    }

    async debugInfo() {
        let nodeInfo = this.getNodeInfo();
        let blockchainFullInfo = await this.blockchain.getFullInfo();
        return {
            ...nodeInfo,
            ...blockchainFullInfo
        };
    }

    getNodeInfo() {
        return {
            selfUrl: address(),
            nodeID: this.nodeID,
        }
    }

    async generateNodeId() {
        this.nodeID = await generateNodeId();
    }

    getAddressesSafeBalances() {
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