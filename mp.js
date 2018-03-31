/* eslint-disable no-unused-vars */
const fs = require('fs')
const path = require('path')
const protobuf = require('protocol-buffers')
const dgram = require('dgram')
const EventEmitter = require('events').EventEmitter
const randombytes = require('randombytes')

const pingPeriod = 3000

const ID_LENGTH = 20
const heartBeat = 0

const opts = {port: 10000, addr: '127.0.0.1', type: 'udp4', id: makeId()}
const socket = dgram.createSocket(opts)

const messages = protobuf(fs.readFileSync(path.join(__dirname, 'schema.proto')))

const nodeList = {}
const inFlight = new Set()

socket.on('message', onhandlemessage)

var pingTimeout = null
function pingInterval () {
  var randIdx = Math.floor(Math.random() * (nodeList.length - 1) + 1)
  var randNode = nodeList[randIdx]

  pingTimeout = setTimeout(function pingTimeout () {
    sendPing(messages.Msg.decode(randNode))
  }, pingPeriod)
}

function sendPing (node) {
  var port = node.destPort || node.port
  var addr = node.destAddr || node.addr
  var msg = {
    nodeId: opts.id,
    addr: opts.addr,
    port: opts.port,
    heartBeat: heartBeat,
    type: 0
  }
  var buf = messages.Msg.encode(msg)

  socket.send(buf, 0, buf.byteLength, port, addr)
}

function makeId () {
  return Buffer.from(randombytes(ID_LENGTH)).toString('hex')
}

function onhandlemessage (_msg) {
  var msg = messages.Msg.decode(_msg)
  if (!inNodeList(_msg)) {
    addToList(_msg)
  }
  if (msg.type === 0) {
    // PING
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

function forward (node) {
  sendPing(node)
  inFlight.add(node.nodeId)
  startTimeout(node.nodeId, node)
}

function inNodeList (node) {
  var dec = messages.Msg.decode(node)
  return Buffer.isBuffer(nodeList[dec.nodeId])
}

function addToList (node) {
  var dec = messages.Msg.decode(node)
  nodeList[dec.nodeId] = dec
  return nodeList
}

function clearACKTimeout () {
  return clearTimeout(pingTimeout)
}

function startTimeout (nodeId, node) {
  var t = setTimeout(function forwardTimeout () {
    if (inFlight.has(nodeId)) {
      return repFail(node)
    }
    return clearTimeout(t)
  }, pingPeriod)
}

function repFail (node) {
  var port = node.port
  var addr = node.addr

  var failMsg = {
    nodeId: opts.id,
    addr: opts.addr,
    port: opts.port,
    heartBeat: heartBeat,
    type: 5,
    destPort: node.destPort,
    destAddr: node.destAddr
  }
  var buf = messages.Msg.encode(failMsg)
  socket.send(buf, 0, buf.byteLength, port, addr)
}

module.exports = function (_opts) {
  return function init () {

  }
}
