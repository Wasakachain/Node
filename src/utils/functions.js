const http = require('http');
const https = require('https');
const Url = require('url');
const querystring = require('querystring');
const ip = require('ip');
const crypto = require('crypto');
const uuidv4 = require('uuid/v4');

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
};

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