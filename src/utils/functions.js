const http = require('http');
<<<<<<< HEAD
const https = require('https');
const Url = require('url');
const querystring = require('querystring');
=======
const elliptic = require('elliptic');
const ec = new elliptic.ec('secp256k1');
>>>>>>> 64e4853f04d3decb294bef994a81f8db20eed7ab

function setHeaders(data) {
    let header = {
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    if (data) {
        header['Content-Length'] = Buffer.byteLength(querystring.stringify(data));
    }
    return header;
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

function descompressPublicKey(pubKeyCompressed) {
    const pubKeyX = pubKeyCompressed.substring(0, 64);
    const pubKeyYOdd = parseInt(pubKeyCompressed.substring(64));
    return ec.curve.pointFromX(pubKeyX, pubKeyYOdd);
}

exports.verifySignature = function (data, publicKey, signature) {
    const publicKeyPoint = descompressPublicKey(publicKey);
    const keyPair = ec.keyPair({ pub: publicKeyPoint });
    return keyPair.verify(data, { r: signature[0], s: signature[1] })
}

