const fs = require('fs')
const path = require('path')
const protobuf = require('protocol-buffers')
const dgram = require('dgram')
const EventEmitter = require('events').EventEmitter
const randombytes = require('randombytes')

const messages = protobuf(fs.readFileSync(path.join(__dirname, 'schema.proto')))

class MemberProcess extends EventEmitter {
  constructor (opts) {
    super()
    var _this = this
    var _opts = opts || {type: 'udp6', lookup: _this.lookup}
    var membershipTable = {}

    this.nodes = []
    this.heartbeat = 0
    this.pingPeriod = 3000
    this.idLength = opts.idLength || 20
    this.id = _opts.id || makeId()
    this.port = opts.port || 0
    this.ip = opts.ip
    this.socket = dgram.createSocket(opts, handleMessage)
    this.socket.on('message', onmessage)

    async function makeId () {
      return Buffer.from(randombytes(this.idLength)).toString('hex')
    }

    function onmessage (msg, remoteInfo) {
      var nodeId = remoteInfo.address.toString() + remoteInfo.port.toString()
      if (!membershipTable[nodeId]) {
        // new node; add it to list, update list, and ack back
        var newNode = {
          id: nodeId,
          msg: msg,
          addr: remoteInfo.address,
          port: remoteInfo.port,
          msgSize: remoteInfo.size
        }
        addNode(newNode)
      }
      var ack = composeMsg(msg, remoteInfo)
      this.socket.send(ack, 0, ack.length, remoteInfo.port, remoteInfo.address, onMessageSend)
    }

    function composeMsg (mgs, rinfo) {

    }

    function addNode (node) {
      membershipTable[node.id] = { msg: node.msg, addr: node.addr, port: node.port }
      return membershipTable
    }

    function onMessageSend () {
      console.log('message sent')
    }
  }

  queryAll (message) {
    // query all nodes in list to get their updated memberlist

  }
  sendPing () {
    var randIdx = Math.floor(Math.random() * (this.nodes.length - 1) + 1)
    var randNode = this.nodes[randIdx]

    var msg = {
      nodeId: this.id,
      ip: this.ip,
      port: this.port,
      heartbeat: this.heartbeat
    }
    var buf = messages.Msg.encode(msg)

    this.socket.send(buf, 0, buf.length, randNode.port, randNode.address)
  }

  lookup (msg) {
    // lookup node in membertable and update any failed nodes; forward if PINGREQ
  }

  listen () {
    this.socket.bind(this.port, this.address)
    this.socket.on('error', (err) => { console.error('Error binding socket: ', err) })
  }

  pingInterval () {
    var _this = this
    setTimeout(function ping () {
      _this.sendPing()
    }, this.pingPeriod)
  }

  startClock () {
    var clockPeriod = 6000
    this.clock = setInterval(function () {
    }, clockPeriod)
  }
}

function handleMessage (msg) {
  console.log('got mssg: ', msg.toString())
}

module.exports = MemberProcess
