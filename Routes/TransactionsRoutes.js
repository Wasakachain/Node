const TransactionClass = require('../src/transaction.js');
const Transaction = new TransactionClass();
const Router = require('express').Router();

// defining the routes for the Transaction model
Router.get('/', Transaction.__index);
Router.get('/:hash', Transaction.__show);
Router.get('/pending', Transaction.__pendingTransactions);
Router.get('/confirmed', Transaction.__confirmedTransactions);
Router.post('/send', Transaction.__send);

module.exports = Router;