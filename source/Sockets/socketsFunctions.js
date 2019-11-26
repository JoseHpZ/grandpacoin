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

function getIPAddress() {
    let interfaces = require('os').networkInterfaces();
    for (let devName in interfaces) {
      let iface = interfaces[devName];
  
      for (let i = 0; i < iface.length; i++) {
        let alias = iface[i];
        if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal)
          return alias.address;
      }
    }
  
    return '0.0.0.0';
  }

module.exports = {
    checkPort,
    getIPAddress,
}