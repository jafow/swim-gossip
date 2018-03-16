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

    async function makeId () {
      return Buffer.from(randombytes(this.idLength)).toString('hex')
    }
  }

  queryAll (message) {
    // query all nodes in list to get their updated memberlist

  }
}

module.exports = MemberProcess
