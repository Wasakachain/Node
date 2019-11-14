const http = require('http');
const crypto = require('crypto');
const elliptic = require('elliptic');
const ec = new elliptic.ec('secp256k1');

exports.sha256 = function (data) {
    return crypto.createHash('sha256').update(data).digest('hex')
}

function formatCompressedPubKey(pubKeyCompressed){
    return `${pubKeyCompressed.substr(64,65) === '0' ? '02' : '03'}${pubKeyCompressed.substr(2,64)}`
}

exports.verifySignature = function (data, publicKey, signature) {
    const keyPair = secp256k1.keyFromPublic(formatCompressedPubKey(publicKey), 'hex');
    return keyPair.verify(data, {r: signature[0], s: signature[1]})
}

