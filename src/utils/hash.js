const http = require('http');
const crypto = require('crypto');

exports.sha256 = function (data) {
    return crypto.createHash('sha256').update(data).digest('hex')
}