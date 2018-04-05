const dgram = require('dgram')

module.exports = function bootstrap (opts) {

    return function bootstrapNode () {
        return {
            listen: listen
        }
    
    }
}
 = dgram.createSocket(_opts)