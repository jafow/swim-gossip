const MP = require('swim-gossip')
const dgram = require('dgram')
const protobuf = require('protocol-buffers')
const messages = protobuf(fs.readFileSync(path.join(__dirname, 'schema.proto')))

// create a bootstrap node
const BOOTSTRAP_PORT = 10000
const BOOTSTRAP_HOST = '1.0.0.0'

var bootstrapNode = dgram.createSocket({
  port: BOOTSTRAP_PORT,
  host: BOOTSTRAP_HOST,
  type: 'udp4'
})

bootstrapNode.on('message', (msg, rinfo) => {
  var JOIN_RES = {
    msgType: 2,
    destPort: rinfo.port,
    destAddr: rinfo.address,
    nodeId: 'bootstrap',
    joinList: getRecentNodes() // get a list of N most recently joined nodes
  }
  var buf = messages.Msg.encode(JOIN_RES)
  // send back to Joining Node
  bootstrapNode.send(buf, 0, buf.byteLength, rinfo.port, rinfo.address)
})

// bootstrap node
bootstrapNode.bind(BOOTSTRAP_PORT, BOOTSTRAP_HOST)

// create 3 member nodes
var n1 = new MP({port: 3333, addr: '1.0.0.1', type: 'udp4'})
var n2 = new MP({port: 3334, addr: '1.0.0.2', type: 'udp4'})
var n3 = new MP({port: 3335, addr: '1.0.0.3', type: 'udp4'})

// init
n1.init()
n2.init()
n3.init()

n3.onMessage('PING', (_msg) => {
  var dec = messages.Msg.decode(_msg)
  console.log(`got message from ${dec.addr}:${dec.port}`)
})

n2.onMessage('ACK', (_msg) => {
  var dec = messages.Msg.decode(_msg)
  console.log(`got an ACK from ${dec.addr}:${dec.port}`)
})

// suddenly a node fails!
n1.destroy()

// check n2 and n3 membershipList after protocol period (1.5 seconds)
setTimeout(function () {
  console.log(`n2.membershipList: ${n2.membershipList}`)
  // n3, n1 is gone
  console.log(`n3.membershipList: ${n3.membershipList}`)
  // n2, n1 is gone
}, 1500)
