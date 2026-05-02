var path = require('path')
var program = require('commander')
program._name = 'zenbot'

var versions = process.versions

function parseVersion(version) {
  return String(version).split('.').map(function (part) {
    return parseInt(part, 10) || 0
  })
}

function isVersionLessThan(current, minimum) {
  var a = parseVersion(current)
  var b = parseVersion(minimum)
  var length = Math.max(a.length, b.length)

  for (var i = 0; i < length; i++) {
    var currentPart = a[i] || 0
    var minimumPart = b[i] || 0
    if (currentPart < minimumPart) return true
    if (currentPart > minimumPart) return false
  }

  return false
}

if (isVersionLessThan(versions.node, '8.3.0')) {
  console.log('You are running a node.js version older than 8.3.x, please upgrade via https://nodejs.org/en/')
  process.exit(1)
}

var fs = require('fs')
  , boot = require('./boot')

boot(function (err, zenbot) {
  if (err) {
    throw err
  }
  program.version(zenbot.version)

  var command_directory = './commands'
  var requestedCommand = process.argv[2]
  fs.readdir(command_directory, function(err, files){
    if (err) {
      throw err
    }
    
    var commands = files.map((file)=>{
      return path.join(command_directory, file)
    }).filter((file)=>{
      return fs.statSync(file).isFile()
    })

    if (requestedCommand) {
      commands = commands.filter((file) => {
        return path.basename(file, '.js') === requestedCommand
      })
    }

    commands.forEach((file)=>{
      require(path.resolve(__dirname, file.replace('.js','')))(program, zenbot.conf)
    })

    program
      .command('*', 'Display help', { noHelp: true })
      .action((cmd)=>{
        console.log('Invalid command: ' + cmd)
        program.help()
      })

    program.parse(process.argv)
  })
})
