const net = require("net");
const server = net.createServer();


function checkPort(port) {
    return new Promise((resolve, reject) => {
        server.once("error", (err) => {
            reject()
        });
        server.once("listening", () => {
            server.close();
            resolve();
        });
        server.listen(port);
    });
}

module.exports = {
    checkPort,
}