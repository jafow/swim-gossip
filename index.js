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

    var inFlight = new Set()
    var pingTimeout = null

    this.nodeList = {}
    this.heartBeat = 0
    this.pingPeriod = 3000
    this.idLength = 20
    this.nodeId = _opts.id || makeId()
    this.port = opts.port || 0
    this.addr = opts.addr
    this.socket = dgram.createSocket(opts, handleMessage)
    this.on('message', onhandlemessage)
    this.socket.on('error', (err) => {
      console.error('Got anerr on sock: ', err)
    })
    listen()

    function makeId () {
      return Buffer.from(randombytes(_this.idLength)).toString('hex')
    }

    function onhandlemessage (_msg) {
      var msg = messages.Msg.decode(_msg)
      console.log('me: ', _this.nodeId, ' receiving ', msg.type, ' from dest: ', msg.destPort);
      if (!inNodeList(_msg)) {
        addToList(_msg)
        this.msgSend(msg, 4)
      }
      if (msg.type === 0) {
        // PING
        this.msgSend(msg, 4)
      }
      if (msg.type === 3) {
        // PING req --> forward
        forward(msg)
      }
      if (msg.type === 4) {
        // ACK; node is healthy
        return clearACKTimeout()
      }
    }

    function inNodeList (node) {
      var dec = messages.Msg.decode(node)
      return Buffer.isBuffer(_this.nodeList[dec.nodeId])
    }

    function addToList (node) {
      var dec = messages.Msg.decode(node)
      _this.nodeList[dec.nodeId] = dec
      return _this.nodeList
    }

    function forward (node) {
      this.msgSend(node, 1)
      inFlight.add(node.nodeId)
      startTimeout(node.nodeId, node)
    }

    function clearACKTimeout () {
      _this.socket.destroy()
      return clearTimeout(pingTimeout)
    }

    function startTimeout (nodeId, node) {
      var self = this
      var t = setTimeout(function forwardTimeout () {
        if (inFlight.has(nodeId)) {
          return repFail(node)
        }
        return clearTimeout(t)
      }, self.pingPeriod)
    }

    function repFail (node) {
      var port = node.port
      var addr = node.addr

      var failMsg = {
        nodeId: this.nodeId,
        addr: this.addr,
        port: this.port,
        heartBeat: this.heartBeat,
        type: 5,
        destPort: node.destPort,
        destAddr: node.destAddr
      }
      var buf = messages.Msg.encode(failMsg)
      this.socket.send(buf, 0, buf.byteLength, port, addr)
    }

    function listen () {
      _this.socket.bind(_this.port, _this.address)
      _this.socket.on('error', (err) => { console.error('Error binding socket: ', err) })
    }

    function handleMessage (msg) {
      _this.emit('message', msg)
    }
  }
  msgSend (node, _msgType) {
    var port = node.destPort || node.port
    var addr = node.destAddr || node.addr
    var msg = {
      nodeId: this.nodeId,
      addr: this.addr,
      port: this.port,
      heartBeat: this.heartBeat++,
      type: 0,
      destPort: port,
      destAddr: addr
    }
    var buf = messages.Msg.encode(msg)

    this.socket.send(buf, 0, buf.byteLength, port, addr)
  }

  addNode (node) {
    var dec = messages.Msg.decode(node)
    this.nodeList[dec.nodeId] = dec
    return this.nodeList
  }
}

module.exports = MemberProcess
