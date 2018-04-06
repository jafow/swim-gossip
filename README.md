# SWIM-gossip
SWIM implementation of gossip protocol.

read about it [here](http://www.cs.cornell.edu/info/projects/spinglass/public_pdfs/swim.pdf)

## example

```javascript
const MP = require('swim-gossip')
const dgram = require('dgram')
const protobuf = require('protocol-buffers')
const messages = protobuf(fs.readFileSync(path.join(__dirname, 'schema.proto')))

// create a bootstrap node
const BOOTSTRAP_PORT = 10000
const BOOTSTRAP_HOST = '1.0.0.1'
var bootstrapNode = dgram.createSocket({
  port: BOOTSTRAP_PORT,
  host: BOOTSTRAP_HOST,
  type: 'udp4'
  });

bootstrapNode.on('message', (msg, rinfo) => {
  var JOIN_MSG = {
    msgType: 2,
    destPort: rinfo.port,
    destAddr: rinfo.address,
    nodeId: 'bootstrap',
    joinList: getRecentNodes() // get a list of N most recently joined nodes
  }
  var buf = messages.Msg.encode(msg)
  // send back to Joining Node
  bootstrapNode.send(buf, 0, buf.byteLength, rinfo.port, rinfo.address)
})

// bootstrap node
bootstrapNode.bind(BOOTSTRAP_PORT, BOOTSTRAP_HOST);

// create 3 member nodes
var n1 = new MP({port: 3333, addr: '127.0.0.1', type: 'udp4'})
var n2 = new MP({port: 3334, addr: '127.0.0.1', type: 'udp4'})
var n3 = new MP({port: 3335, addr: '127.0.0.1', type: 'udp4'})

// init
n1.init(bootstrapOpts)
n2.init(bootstrapOpts)
n3.init(bootstrapOpts)

n3.onMessage('PING', (_msg) => {
  var dec = messages.Msg.decode(_msg)
  console.log(`got message from ${dec.addr}:${dec.port}`)
})

// node fails!
n1.destroy()
n1 = null;

// check n2 and n3 membershipList after protocol period (1.5 seconds)
setTimeout(function () {
  console.log(`n2.membershipList: ${n2.membershipList}`)
  // n3, n1 is gone
  console.log(`n3.membershipList: ${n3.membershipList}`)
  // n2, n1 is gone
}, 1500)
```
## Todo
- [ ] failure detection

1.  node sends a PING message to a random node M₁ in list

    *   if an ACK is not received M₁ before time period _T_: node sends PING-REQ
    to _K_ number of randomly chosen nodes, who forward a PING onto M₁.

2.  after _T_ if no ACK is received by M₁ it is failed and node sends
    dissemenation message

- [ ] message dissemination notification

*   on determining a failure, send multicast FAIL to all nodes in `nodeList`

- [ ] tapenet/mininet test

- [ ] bootstrapping

1. node M₁ sends a `JOIN_REQ` message to a known facilitator B that keeps list of
   the last N nodes that recently joined.

2. M₁ receives the `JOIN_REP` response with list of nodes to announce to:
    *   v0.0.1: bootstrap node has a known address
    *   v0.0.2: use dns to resolve a name :star:

```javascript
// list of most recently seen nodes
{
  msgType: 5,
  nodes: [
  {nodeId: 'deadbeef', heartbeat: 44, port: 10000, address: '1.1.1.1'},
  {nodeId: '12be98', heartbeat: 16, port: 10000, address: '1.1.1.1'},
  {nodeId: '12345af', heartbeat: 20, port: 10000, address: '1.1.1.1'},
  {nodeId: '9129bea', heartbeat: 22, port: 10000, address: '1.1.1.1'}
  ]
}
```


## API

### var mp = new MP(opts)
where opts are 
```javascript
{
    port: <Number>, // defaults to 0
    addr: <String>, // defaults to '1.1.1.1'
    type: <String>, // one of 'udp4' or 'udp6', defaults to 'udp4'
    protocolPeriod: <Number> // milliseconds, defaults to 4000
    pingPeriod: <Number> // milliseconds, defaults to 1000
}
```

### mp.join(port, address)
Sends a JOIN_REQ message type to bootstrap node

### mp.destroy(cb)
Tear down a running node. Sends a multicast LEAVE message type to all members in
list, closes the socket, and clears the membership list.
