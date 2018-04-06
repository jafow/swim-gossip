const fs = require('fs')
const path = require('path')
const debug = require('debug')('MP')
const protobuf = require('protocol-buffers')
const dgram = require('dgram')
const EventEmitter = require('events').EventEmitter
const randombytes = require('randombytes')
const bootstrapNode = {port: 10000, addr: '1.0.0.1'}

const messages = protobuf(fs.readFileSync(path.join(__dirname, 'schema.proto')))

class MemberProcess extends EventEmitter {
  constructor (opts) {
    super()
    var _this = this
    var _opts = opts || {type: 'udp6'}

    var inFlight = new Set()
    var pingTimeout = null
    var idLength = 16

    this.nodeList = {}
    this.heartBeat = 0
    this.pingPeriod = 1500
    this.protocolPeriod = 4000
    this.nodeId = _opts.id || makeId()
    this.port = _opts.port || 0
    this.addr = _opts.addr || '1.1.1.1'

    this.socket = dgram.createSocket({type: _opts.type})
    this.socket.on('error', onhandleerror)
    this.socket.on('message', onhandlemessage)

    this.init()

    function makeId () {
      return Buffer.from(randombytes(idLength)).toString('hex')
    }

    function onhandlemessage (_msg) {
      var msg = messages.Msg.decode(_msg)
      var newMsgType = null
      var newMsg = Object.assign({}, msg, {destPort: msg.port, destAddr: msg.addr})

      debug(`me: ${_this.port} \treceiving ${msg.type} from dest: ${msg.port}`)

      if (!inNodeList(_msg)) {
        addToList(_msg)
        debug(`\tme: ${_this.port} \t adding new node at dest:${msg.port}`)
      }
      if (msg.type === 0) {
        // PING
        debug(`${_this.port} \tsending ACK to seen node ${msg.port} that pinged me`)
        newMsgType = 4
        return _this.msgSend(newMsg, newMsgType)
      }
      if (msg.type === 1) {
        // JOIN REQ -> send memberlist
      }
      if (msg.type === 2) {
        // JOIN RES from bootstrap node -> update member list
        // update memberlist
        // start ping timeout
      }
      if (msg.type === 3) {
        // PING REQ --> forward
        newMsgType = 3
        return forward(newMsg, newMsgType)
      }
      if (msg.type === 4) {
        // ACK; node is healthy
        debug(`me: ${_this.port} received ACK from ${msg.port} from my PING, closing down`)
        return clearACKTimeout()
      }
    }

    function onhandleerror (err) {
      console.error('Got anerr on sock: ', err)
      _this.emit('error', err)
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
      process.exit(1)
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
  }

  onmessagesend (err) {
    if (err) return this.socket.emit('error', err)
  }

  msgSend (node, _msgType) {
    var self = this
    var destPort = node.destPort
    var destAddr = node.destAddr
    var msg = {
      nodeId: self.nodeId,
      addr: self.addr,
      port: self.port,
      heartBeat: self.heartBeat++,
      type: _msgType,
      destPort: destPort,
      destAddr: destAddr
    }
    var buf = messages.Msg.encode(msg)

    this.socket.send(buf, 0, buf.byteLength, destPort, destAddr, function (m) {
      debug(`message sent: from ${self.port} to dest: ${destPort}`)
      self.onmessagesend(m)
    })
  }

  addNode (node) {
    var dec = messages.Msg.decode(node)
    this.nodeList[dec.nodeId] = dec
    return this.nodeList
  }

  listen () {
    this.socket.bind(this.port, this.address)
  }

  init () {
    this.listen()
    this.msgSend(bootstrapNode, 1)
  }
}

module.exports = MemberProcess
