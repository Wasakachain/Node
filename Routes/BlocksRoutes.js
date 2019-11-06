const BlockClass = require('../src/Block.js');
const Block = new BlockClass();
const Router = require('express').Router();

// defining the routes for the block model
Router.get('/', Block.__index);
Router.get('/:index', Block.__show);

module.exports = Router;