const crypto = require('crypto');
const elliptic = require('elliptic');
const ec = new elliptic.ec('secp256k1');

exports.sha256 = function (data) {
    return crypto.createHash('sha256').update(data).digest('hex')
}

function formatCompressedPubKey(pubKeyCompressed) {
    let pkC = pubKeyCompressed.replace('0x', '');
    return `${pkC.substr(64, 65) === '0' ? '02' : '03'}${pkC.substr(0, 64)}`
}

exports.verifySignature = function (data, publicKey, signature) {
    const keyPair = ec.keyFromPublic(formatCompressedPubKey(publicKey), 'hex');
    return keyPair.verify(data, { r: signature[0], s: signature[1] })
}

