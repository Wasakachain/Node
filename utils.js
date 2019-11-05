const http = require('http');
const crypto = require('crypto');

exports.sha256 = function (data) {
    return crypto.createHash('sha256').update(data).digest('hex')
}

exports.request = function (options) {
    callback = function (response) {
        var str = ''
        response.on('data', function (chunk) {
            str += chunk;
        });

        response.on('end', function () {
            console.log(str);
        });
    }

    let req = http.request(options, callback);
    req.write("data");
    req.end();
}