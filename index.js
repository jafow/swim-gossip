const protobuf = require('protocol-buffers')
const dgram = require('dgram')
const EventEmitter = require('events').EventEmitter
const randombytes = require('randombytes')

class MemberProcess extends EventEmitter {
  constructor (opts) {
    super()
    var _opts = opts || {}
    this.nodes = []
    this.heartbeat = 0
    this.idLength = opts.idLength || 20
    this.id = _opts.id || makeId()
    this.port = opts.port || 0;

    async function makeId () {
      return Buffer.from(randombytes(this.idLength)).toString('hex')
    }
  }

  queryAll (message) {
    // query all nodes in list to get their updated memberlist

  }
  sendPing(node) {

  }
  lookup(msg) {

  }
  listen() {
    var opts = {type: 'udp4', lookup: lookup}
    this.socket = dgram.createSocket(opts, handleMessage)
  }

  function handleMessage(msg) {
    console.log('got mssg: ', msg.toString())
  }
}

module.exports = MemberProcess
