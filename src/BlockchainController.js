const blockchain = new (require('./Blockchain'))();
const Transaction = require('./Transaction');

blockchain.pendingTransactions.push(Transaction('0', '0', 0, 0, 0, 0, 0).getData());
blockchain.confirmedTransactions.push(Transaction('0', '0', 0, 0, 0, 0, 0, 0, true).getData());

class BlockchainController {
  // node index
  static nodeIndex(req, response) {
    return response.send({
      about: 'foo',
      'nodeId': 'foo',
      'chainId': 'foo',
      'nodeUrl': 'foo',
      'peers': 'foo',
      'blocksCount': 'foo',
      'confirmedTransactions': 'foo',
    });
  }

  static debug(req, response) {
    return response.send({ message: 'enjoy debugging!' });
  }

  static resetChain(req, response) {
    return response.send({ message: 'the chain was reset to its genesis block' });
  }

  static balances(req, response) {
    return response.send({ message: 'this are all the address balances' });
  }

  static startMiner(req, response) {
    return response.send({ message: 'mining block' });
  }

  static getMinerDifficulty(req, response) {
    return response.send({ message: 'this is the miner difficulty: OMG' });
  }

  static showPeers(req, response) {
    return response.send({ message: 'this are all the peers connected' });
  }

  static connectPeer(req, response) {
    return response.send({ message: '¡succesfully connected peer!\n¡Welcome to WasakaChain!' });
  }

  static broadcastBlocks(req, response) {
    return response.send({ message: 'blockchain broadcasted to all peers connected' });
  }
  // transactions methods
  static addressBalance(req, response) {
    return response.send({ message: `this is the address ${req.params.address} balance` });
  }

  static addressTransactions(req, response) {
    return response.send({ message: `this is the address ${req.params.address} transactions` });
  }
  // blockchain methods
  static addBlock(req, response) {
    return response.send({ message: `block added` });
  }
  // block methods
  static blockIndex(req, response) {
    return response.send({ message: `block` });
  }
  static blockByIndex(req, response) {
    return response.send({ message: `block${req.params.index}` });
  }
  // transaction methods
  static transactionIndex(_, response) {
    return response.send({ message: 'this are all the transactions' });
  }

  static show(req, response) {
    return response.send({ message: `this is the transaction hash number: ${req.params.hash}` });
  }

  static pendingTransactions(_, response) {
    return response.send({ transactions: blockchain.pendingTransactions });
  }

  static confirmedTransactions(_, response) {
    return response.send({ transactions: blockchain.confirmedTransactions });
  }

  static send(_, response) {
    return response.send({ message: 'transaction done!' });
  }
}

module.exports = BlockchainController;