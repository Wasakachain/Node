const http = require('http');
const crypto = require('crypto');
const elliptic = require('elliptic');
const ec = new elliptic.ec('secp256k1');

exports.sha256 = function (data) {
    return crypto.createHash('sha256').update(data).digest('hex')
}

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

