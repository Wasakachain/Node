const http = require('http');
const https = require('https');
const Url = require('url');
const querystring = require('querystring');
const ip = require('ip');
const crypto = require('crypto');
const uuidv4 = require('uuid/v4');

const events = require('events');

exports.NewPeerConnected = new events.EventEmitter();
exports.NewBlock = new events.EventEmitter();
exports.NewTransaction = new events.EventEmitter();

function setHeaders(data) {
    let header = {
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    if (data) {
        header['Content-Length'] = Buffer.byteLength(querystring.stringify(data));
    }
    return header;
}

exports.address = function () {
    return 'http://' + ip.address() + ':' + (process.env.port || 5555);
}

exports.request = (url, method, data) => {
    return new Promise((resolve, reject) => {
        let parsedUrl = Url.parse(url);
        const handler = parsedUrl.port == 443 ? https : http;

        let output = '';
        const req = handler.request({
            host: `${parsedUrl.hostname}`, port: parsedUrl.port, path: parsedUrl.path, method, headers: setHeaders(data)
        }, (res) => {
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
                output += chunk;
            });

            res.on('end', () => {
                let response = JSON.parse(output);
                if (res.statusCode >= 300) {
                    reject({ status: res.statusCode, data: response });
                    return;
                }
                resolve({ status: res.statusCode, data: response });
            });
        });

        req.on('error', (err) => {
            reject({ error: err });
        });

        if (data) {
            req.write(querystring.stringify(data));
        }

        req.end();
    })
}

exports.isValidAddress = function (address) {
    const unprefixedAddress = address.replace(/^0x/, '');
    if (/^([A-Fa-f0-9]{40})$/.test(unprefixedAddress))
        return unprefixedAddress;
    else
        return false;
}

exports.generateNodeId = () => {
    return crypto
        .createHash('sha256')
        .update((new Date()).toISOString() + uuidv4())
        .digest('hex');
}

exports.handleNotFound = (_, res) => {
    return res
        .status(404)
        .json({
            error: {
                message: 'WasakaChain API Endpoint not found'
            },
        });
}

exports.paginateBlocks = (blocks, paginationObj) => {
    let { current_page, paginate } = paginationObj;
    // if its a node request, just simply returns all the blocks
    if (!paginate && !current_page) {
        return blocks;
    }
    // set the variables
    if (!paginate) {
        paginate = 20;
    }
    if (!current_page) {
        current_page = 1
    }
    let lastPage = Math.round(blocks.length / paginate);
    let blocksToSend = [];
    blocks = blocks.length > paginate ? blocks.splice(-(current_page * paginate), paginate) : blocks;
    for (let index = blocks.length - 1; index >= 0; index--) {
        blocksToSend[index] = blocks[index];
    }
    return {
        blocks: blocksToSend,
        currentPage: current_page,
        nextPage: current_page < lastPage ? current_page + 1 : null,
        lastPage: lastPage !== 0 ? lastPage : 1,
        blocksPerPage: paginate,
        totalBlocks: blocks.length
    };
}

exports.paginateTransactions = (transactions, paginationObj) => {
    let { current_page, paginate } = paginationObj;
    // if its a node request, just simply returns all the transactions
    if (!paginate && !current_page) {
        return { transactions };
    }


    // set the variables
    paginate = paginate ? parseInt(paginate) : 10;
    current_page = current_page ? parseInt(current_page) : 1;
    let length = transactions.length;
    let lastPage = Math.round(transactions.length / paginate);
    let transactionsToSend = {};
    if (transactions.length > 0) {
        transactions = transactions.length > paginate ? transactions.splice(-(current_page * paginate), paginate) : transactions;
        for (let index = transactions.length - 1; index >= 0; index--) {
            let { transactionDataHash } = transactions[index];
            transactionsToSend[transactionDataHash] = transactions[index];
        }
    }
    return {
        transactions: transactionsToSend,
        currentPage: current_page,
        nextPage: current_page < lastPage ? current_page + 1 : null,
        lastPage: lastPage !== 0 ? lastPage : 1,
        transactionsPerPage: paginate,
        totalTransactions: length
    };
}

exports.setCorsHeadersMiddleware = (request, response, next) => {
    response.set({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST',
        'Access-Control-Allow-Headers': 'Accept,Content-Type'
    });
    next();
}
