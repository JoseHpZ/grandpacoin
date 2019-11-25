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
    var interfaces = require('os').networkInterfaces();
    for (var devName in interfaces) {
      var iface = interfaces[devName];
  
      for (var i = 0; i < iface.length; i++) {
        var alias = iface[i];
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