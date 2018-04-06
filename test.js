var MP = require('./')
var test = require('tapenet')
var bootstrapServer = require('./bootstrap.js')

bootstrapServer.listen(10000)

var {h1, h2, h3} = test.topologies.basic()

test('Test MP creates a membership list', function (t) {
  t.run(h1, function () {
    var m1 = new MP({port: 10001, addr: this.address()})
    m1.init(10000, bootstrapServer.addres())
    setTimeout(function () {
      t.deepEqual(m1.memberList, [{port: 1002, addr: '1.0.0.2', heartbeat: 1}, {port: 1003, addr: '1.0.0.3', heartbeat: 1}])
    }, 3001)
  })

  t.run(h2, function () {
    var m2 = new MP({port: 10002, addr: '1.0.0.2'})
    m2.init(10000, bootstrapServer.addres())

    setTimeout(function () {
      t.deepEqual(m2.memberList, [{port: 1001, addr: '1.0.0.2', heartbeat: 1}, {port: 1003, addr: '1.0.0.3', heartbeat: 1}])
    }, 3002)
  })

  t.run(h3, function () {
    var m3 = new MP({port: 10003, addr: '1.0.0.3'})
    m3.init(10000, bootstrapServer.addres())

    setTimeout(function () {
      t.deepEqual(m3.memberList, [{port: 1002, addr: '1.0.0.2', heartbeat: 1}, {port: 1003, addr: '1.0.0.3', heartbeat: 1}])
    }, 3003)
  })
})
