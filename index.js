const protobuf = require('protocol-buffers')
const dgram = require('dgram')
const EventEmitter = require('events').EventEmitter
const randombytes = require('randombytes')

class MemberProcess extends EventEmitter {
  constructor (opts) {
    super()
    var _this = this
    var _opts = opts || {type: 'udp6', lookup: _this.lookup}
    var membershipTable = {}
    this.nodes = []
    this.heartbeat = 0
    this.idLength = opts.idLength || 20
    this.id = _opts.id || makeId()
    this.port = opts.port || 0
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
      updateList(msg, remoteInfo)
      var ack = composeMsg(msg, remoteInfo)
      this.socket.send(ack, 0, ack.length, remoteInfo.port, remoteInfo.address, onMessageSend)
    }

    function composeMsg (mgs, rinfo) {

    }

    function updateList (msg, rinfo) {

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
  sendPing (node) {

  }
  lookup (msg) {

  }
  listen () {
    this.socket.bind(this.port, this.address)
    this.socket.on('error', (err) => { console.error('Error binding socket: ', err) })
  }
}

function handleMessage (msg) {
  console.log('got mssg: ', msg.toString())
}

module.exports = MemberProcess
