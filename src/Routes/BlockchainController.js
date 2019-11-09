const node = new (require('../models/Node'))();
const { request, address, newPeerConnected } = require('../utils/functions');

class BlockchainController {
  // node index
  static nodeIndex(_, response) {
    let nodeData = node.index();
    return response.send(nodeData);
  }

  static debug(req, response) {
    return node.debugInfo().then(data => response.json(data))
  }

  static resetChain(req, response) {
    node.generateWasakaChain();
    return response.send({ message: 'The chain was reset to its genesis block' });
  }

  static balances(_, response) {
    let addressesInfo = node.getAddressesSafeBalances();
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
    return response.send(node.peers);
  }

  static async connectPeer(req, response) {
    const { peerUrl } = req.body;
    try {
      let res = await request(`${peerUrl}/info`, 'GET');
      if (node.peers[res.data.nodeID]) {
        return response.status(409).send({ errorMsg: `Already connected to peer: ${peerUrl}` });
      }
      if (res.data.nodeID === node.nodeID) {
        return response.status(400).send({ errorMsg: 'Invalid peer url' })
      }

      node.peers[res.data.nodeID] = peerUrl;
      await request(`${peerUrl}/peers/connect`, 'POST', { peerUrl: address() })

      console.log('\x1b[46m%s\x1b[0m', `Connected to peer ${peerUrl}`);
      newPeerConnected.emit('connection', peerUrl);

      return response.send({ message: `Connected to peer: ${peerUrl}` });

    } catch (error) {
      if (error.status === 409) {
        console.log('\x1b[46m%s\x1b[0m', `Connected to peer ${peerUrl}`);
        newPeerConnected.emit('connection', peerUrl);

        return response.send({ message: `Connected to peer: ${peerUrl}` })
      }

      console.log('\x1b[46m%s\x1b[0m', `Connection to peer ${peerUrl} failed`);
      return response.status(400).send(error)
    }
  }

  static broadcastBlocks(req, response) {
    return response.send({ message: 'blockchain broadcasted to all peers connected' });
  }

  // transactions methods
  static addressBalance(req, response) {
    console.log(req.params.address)
    return response.send({ message: `this is the address ${req.params.address} balance` });
  }

  static addressTransactions(req, response) {
    const { address } = req.params;

    let transactions = [...node.confirmedTransactions, ...node.pendingTransactions]
      .filter((transaction) => transaction.from === address || transaction.to === address);

    if (!transactions.length > 0) {
      return response.status(404).send({ address, message: 'No transactions found for address' });
    }

    return response.send({ transactions });
  }

  // blockchain methods
  static addBlock(req, response) {
    return response.send({ message: `block added` });
  }

  // block methods
  static blockIndex(req, response) {
    return response.send(node.blockchain);
  }

  static blockByIndex(request, response) {
    const { index: requestedIndex } = request.params;
    const block = node.find(({ index: { index } }) => index == requestedIndex);
    if (block) {
      return response.json(block);
    }
    return response.status(404).send({
      index: requestedIndex,
      message: `Block not Found in chain`
    });
  }

  // transaction methods
  static transactionIndex(request, response) {
    return response.send({ message: 'this are all the transactions' });
  }

  static show(request, response) {
    const { hash } = request.params;

    if (!/^0x([A-Fa-f0-9]{64})$/.test(hash)) {
      return response
        .status(400)
        .json({ message: 'Invalid transaction hash' })
    }

    let transaction = [...node.confirmedTransactions
      , ...node.pendingTransactions]
      .find(txn => txn.transactionDataHash === hash)

    if (transaction) return response.status(200).json(transaction)

    return response
      .status(404)
      .json({ message: 'Transaction not found' })
  }

  static pendingTransactions(_, response) {
    return response.send({ transactions: node.pendingTransactions });
  }

  static confirmedTransactions(_, response) {
    return response.send({ transactions: node.confirmedTransactions });
  }

  static send(_, response) {
    return response.send({ message: 'transaction done!' });
  }
}

module.exports = BlockchainController;