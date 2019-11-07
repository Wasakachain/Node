const http = require('http');

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