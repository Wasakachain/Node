const Router = require('express').Router();
const NodeController = require('../controllers/NodeController');
const PeerControlller = require('../controllers/PeerController');
const BlockController = require('../controllers/BlockController');
const TransactionController = require('../controllers/TransactionController');
const AddressController = require('../controllers/AdddressController');

// defining the routes for the block model
Router.get('/info', NodeController.nodeIndex); //done
// debugging routes
Router.get('/debug', NodeController.debug); // done
Router.get('/debug/reset-chain', NodeController.resetChain); //done
Router.post('/debug/mine/:minerAddress/:difficulty', NodeController.getMinerDifficulty);
// balances routes
Router.get('/balances', AddressController.balances); //done
Router.get('/address/:address/balance', AddressController.addressBalance);
Router.get('/address/:address/transactions', AddressController.addressTransactions); //done
// mining routes
Router.get('/mining/get-mining-job/:minerAddress', BlockController.createMiningJob);
Router.post('/mining/submit-mined-block', BlockController.receiveBlock);
// peers routes
Router.get('/peers', PeerControlller.showPeers); //done
Router.post('/peers/connect', PeerControlller.connectPeer); //necessary audit
Router.post('/peers/notify-new-block', PeerControlller.blockNotification);
// defining the routes for the block model
Router.get('/blocks', BlockController.blockIndex); //Done
Router.get('/blocks/:index', BlockController.blockByIndex); //done
// defining the routes for the Transaction model
Router.get('/transactions/', TransactionController.transactionIndex); //not found in instructions
Router.get('/transactions/pending', TransactionController.pendingTransactions); //done
Router.get('/transactions/confirmed', TransactionController.confirmedTransactions); //done
Router.get('/transactions/:hash', TransactionController.show); //done
Router.post('transactions/send', TransactionController.send);

module.exports = Router;
