const NodeClass = require('../src/Node.js');
const TransactionClass = require('../src/transaction.js');
const BlockChainClass = require('../src/Blockchain.js');
const Node = new NodeClass();
const Blockchain = new BlockChainClass();
const Transaction = new TransactionClass();
const Router = require('express').Router();

// defining the routes for the block model
Router.get('/info', Node.__index);
// debugging routes
Router.get('/debug', Node.__debug);
Router.get('/debug/reset-chain', Node.__resetChain);
Router.post('/debug/mine/:minerAddress/:difficulty', Node.__getMinerDifficulty);
// balances routes
Router.get('/balances', Node.__balances);
Router.get('/address/:address/balance', Transaction.__addressBalance);
Router.get('/address/:address/transactions', Transaction.__addressTransactions);
// mining routes
Router.get('/mining/get-mining-job/:miner-address', Node.__startMiner);
Router.post('/mining/submit-mined-block', Blockchain.__addBlock);
// peers routes
Router.post('/peers', Node.__showPeers);
Router.post('/peers/connect', Node.__connectPeer);
Router.post('/peers/notify-new-block', Node.__broadcastBlocks);

module.exports = Router;
