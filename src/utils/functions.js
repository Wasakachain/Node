const http = require('http');
const elliptic = require('elliptic');
const ec = new elliptic.ec('secp256k1');

exports.request = function ({ host, path }) {
    return new Promise((resolve, reject) => {
        let req = http.get({ host, path }, function (res) {
            if (res.statusCode >= 300) reject();
            let bodyChunks = [];
            res.on('data', function (chunk) {
                bodyChunks.push(chunk);
            }).on('end', function () {
                let body = Buffer.concat(bodyChunks);
                resolve(body)
            })
        });

        req.on('error', function (e) {
            reject(e)
        });
    });
}

function descompressPublicKey(pubKeyCompressed){
    const pubKeyX = pubKeyCompressed.substring(0, 64);
    const pubKeyYOdd = parseInt(pubKeyCompressed.substring(64));
    return ec.curve.pointFromX(pubKeyX, pubKeyYOdd);
}

exports.verifySignature = function(data, publicKey, signature) {
    const publicKeyPoint = descompressPublicKey(publicKey);
    const keyPair = ec.keyPair({pub: publicKeyPoint});
    return keyPair.verify(data, {r: signature[0], s: signature[1]})
}


