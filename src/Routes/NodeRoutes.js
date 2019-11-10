const Controller = require('./BlockchainController');
const Router = require('express').Router();

// Router.use('/peers/connect', Controller.connectPeerMiddleware);

// defining the routes for the block model
Router.get('/info', Controller.nodeIndex); //done
// debugging routes
Router.get('/debug', Controller.debug); // done
Router.get('/debug/reset-chain', Controller.resetChain); //done
Router.post('/debug/mine/:minerAddress/:difficulty', Controller.getMinerDifficulty);
// balances routes
Router.get('/balances', Controller.balances); //done
Router.get('/address/:address/balance', Controller.addressBalance);
Router.get('/address/:address/transactions', Controller.addressTransactions); //done
// mining routes
Router.get('/mining/get-mining-job/:minerAddress', Controller.startMiner);
Router.post('/mining/submit-mined-block', Controller.addBlock);
// peers routes
Router.get('/peers', Controller.showPeers); //done
Router.post('/peers/connect', Controller.connectPeer); //necessary audit
Router.post('/peers/notify-new-block', Controller.broadcastBlocks);
// defining the routes for the block model
Router.get('/blocks', Controller.blockIndex); //Done
Router.get('/blocks/:index', Controller.blockByIndex); //done
// defining the routes for the Transaction model
Router.get('/transactions/', Controller.transactionIndex); //not found in instructions
Router.get('/transactions/pending', Controller.pendingTransactions); //done
Router.get('/transactions/confirmed', Controller.confirmedTransactions); //done
Router.get('/transactions/:hash', Controller.show); //done
Router.post('transactions/send', Controller.send);

module.exports = Router;
