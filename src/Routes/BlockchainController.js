const node = new (require('../models/Node'))();
const { request, address } = require('../utils/functions');

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
    node.generateWasakaChain();
    return response.send({ message: 'The chain was reset to its genesis block' });
  }

  static balances(_, response) {
    let addressesInfo = node.getAddressesBalances();
    if (addressesInfo) {
      return response.send({ addressesBalances: addressesInfo });
    }
    return response.status(404).send({ message: 'No Addresses Found' })
  }

  static startMiner(req, response) {
    return response.send({ message: 'mining block' });
  }

  static getMinerDifficulty(req, response) {
    return response.send({ message: 'this is the miner difficulty: OMG' });
  }

  static showPeers(req, response) {
    return response.send(node.blockchain.peers);
  }

  static async connectPeer(req, response) {
    const { peerUrl } = req.body;
    try {
      let res = await request(`${peerUrl}/info`);
      if (node.blockchain.peers[res.nodeID]) {
        return response.status(409).send({ errorMsg: `Already connected to peer: ${peerUrl}` });
      }
      node.blockchain.peers[res.nodeID] = peerUrl;
      await request(`${peerUrl}/peers/connect`, 'POST', { peerUrl: address() })

      console.log('\x1b[31m%s\x1b[0m', `Connected to peer ${peerUrl}`);
      return response.send({ message: `Connected to peer: ${peerUrl}` });

    } catch (error) {
      return response.status(500).send(error);
    }
  }

  static broadcastBlocks(req, response) {
    return response.send({ message: 'blockchain broadcasted to all peers connected' });
  }

  // transactions methods
  static addressBalance(req, response) {
    return response.send({ message: `this is the address ${req.params.address} balance` });
  }

  static addressTransactions(req, response) {
    const { address } = req.params;

    let transactions = [...node.blockchain.confirmedTransactions, ...node.blockchain.pendingTransactions]
      .filter((transaction) => transaction.from === address || transaction.to === address);

    if (!transactions.length > 0) {
      return response.status(404).send({ address, message: 'No transactions found for address' });
    }

    return response.send({transactions });
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

  static show(_, response) {
    const { hash } = request.params;

    if (!/^0x([A-Fa-f0-9]{64})$/.test(hash)) {
      return response
        .status(400)
        .json({ message: 'Invalid transaction hash' })
    }

    let transaction = [...node.blockchain.confirmedTransactions
      , ...node.blockchain.pendingTransactions]
      .find(txn => txn.transactionDataHash === hash)

    if (transaction) return response.status(200).json(transaction)

    return response
      .status(404)
      .json({ message: 'Transaction not found' })
  }

  static pendingTransactions(_, response) {
    return response.send({ transactions: node.blockchain.pendingTransactions });
  }

  static confirmedTransactions(_, response) {
    return response.send({ transactions: node.blockchain.confirmedTransactions});
  }

  static send(_, response) {
    return response.send({ message: 'transaction done!' });
  }
}

module.exports = BlockchainController;