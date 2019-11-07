const Blockchain = require('./Blockchain');

class Node {
    constructor() {
        this.blockchain = new Blockchain();
        this.nodeID;
    }
}

module.exports = Node;