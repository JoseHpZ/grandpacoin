const http = require('http');

class Request {
    static get(url) {
        return Request.readOnlyResult(url, { method: 'get' });
    }
    static post(url, options = {}) {
        return Request.sendResult(url, options);
    }

    static readOnlyResult(url, options = {}) {
        return new Promise((resolve, reject) => {
            http[options.method](url, res => {
                Request.formatDataChunk(res, resolve, reject);
            }).on('error', reject);
        });
    }
    static sendResult(url, options = {}) {
        return new Promise((resolve, reject) => {
            const config = {
                hostname: options.hostname || 'localhost',
                port: options.port || 5555,
                path: url,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
            };

            const req = http.request(config, res => {
                Request.formatDataChunk(res, resolve, reject);
            });

            if (options.body) req.write(JSON.stringify(options.body));

            req.on('error', reject);
            req.end()
        });
    }
    static formatDataChunk(res, resolve, reject) {
        let data = '';

        res.on('data', (d) => {
            data += d;
        });
        res.on('end', () => {
            const result = res.statusCode >= 200 && res.statusCode < 300 ? resolve : reject;
            result(JSON.parse(data))
        })
    }
}

module.exports = Request;