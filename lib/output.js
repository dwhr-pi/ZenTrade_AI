var path = require('path')

module.exports = function output (conf) {

  var initializeOutput = function(tradeObject) {
    for (var output in conf.output) {
      if (conf.output[output].on) {
        if (conf.debug) {
          console.log(`initializing output ${output}`)
        }
        try {
          require(path.resolve(__dirname, `../extensions/output/${output}`))(conf).run(conf.output[output], tradeObject)
        } catch (err) {
          console.error(`warning: output ${output} could not be initialized and will be skipped`)
          console.error(err.message || err)
        }
      }
    }
  }

  return {
    initializeOutput: initializeOutput
  }
}
