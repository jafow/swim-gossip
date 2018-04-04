const MP = require('./index.js')

var n1 = new MP({port: 3333, addr: '127.0.0.1', type: 'udp4'})
var n2 = new MP({port: 3334, addr: '127.0.0.1', type: 'udp4'})

var m = {
  nodeId: n1.nodeId,
  addr: n1.addr,
  port: n1.port,
  destAddr: n2.addr,
  destPort: n2.port,
  type: 0
}

n1.msgSend(m, 0)
