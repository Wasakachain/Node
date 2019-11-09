const Controller = require('./BlockchainController');
const Router = require('express').Router();

// defining the routes for the block model
Router.get('/info', Controller.nodeIndex);
// debugging routes
Router.get('/debug', Controller.debug);
Router.get('/debug/reset-chain', Controller.resetChain);
Router.post('/debug/mine/:minerAddress/:difficulty', Controller.getMinerDifficulty);
// balances routes
Router.get('/balances', Controller.balances);
Router.get('/address/:address/balance', Controller.addressBalance);
Router.get('/address/:address/transactions', Controller.addressTransactions);
// mining routes
Router.get('/mining/get-mining-job/:miner-address', Controller.startMiner);
Router.post('/mining/submit-mined-block', Controller.addBlock);
// peers routes
Router.get('/peers', Controller.showPeers);
Router.post('/peers/connect', Controller.connectPeer);
Router.post('/peers/notify-new-block', Controller.broadcastBlocks);
// defining the routes for the block model
Router.get('/blocks', Controller.blockIndex);
Router.get('/blocks/:index', Controller.blockByIndex);
// defining the routes for the Transaction model
Router.get('transactions/', Controller.transactionIndex);
Router.get('transactions/:hash', Controller.show);
Router.get('/transactions/pending', Controller.pendingTransactions);
Router.get('/transactions/confirmed', Controller.confirmedTransactions);
Router.post('transactions/send', Controller.send);

module.exports = Router;