class Node {
  constructor() {
      // binding methods
      this.__index = this.__index.bind(this);
      this.__debug = this.__debug.bind(this);
  }

  __index(req, response) {
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

  __debug(req, response) {
      return response.send({ message: 'enjoy debugging!' });
  }

  __resetChain(req, response) {
      return response.send({ message: 'the chain was reset to its genesis block' });
  }

  __balances(req, response) {
      return response.send({ message: 'this are all the address balances' });
  }

  __startMiner(req, response) {
      return response.send({ message: 'mining block' });
  }

  __getMinerDifficulty(req, response) {
      return response.send({ message: 'this is the miner difficulty: OMG' });
  }

  __showPeers(req, response) {
      return response.send({ message: 'this are all the peers connected' });
  }

  __connectPeer(req, response) {
      return response.send({ message: '¡succesfully connected peer!\n¡Welcome to WasakaChain!' });
  }

  __broadcastBlocks(req, response) {
      return response.send({ message: 'blockchain broadcasted to all peers connected' });
  }
}

module.exports = Node;