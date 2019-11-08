const http = require('http');

exports.request = function ({ host, path }) {
    return new Promise((resolve, reject) => {
        let req = http.get({ host, path }, function (res) {
            if (res.statusCode >= 300) reject();
            let bodyChunks = [];
            res.on('data', function (chunk) {
                bodyChunks.push(chunk);
            }).on('end', function () {
                let body = Buffer.concat(bodyChunks);
                console.log('BODY: ' + body);
                resolve(body)
            })
        });

        req.on('error', function (e) {
            console.log('ERROR: ' + e.message);
            reject(e)
        });
    });
}


