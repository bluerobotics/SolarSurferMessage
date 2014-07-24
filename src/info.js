// load modules
var fs = require('fs');
var Message = require('./Message.js');
Message.loadConfigFile();

// print header information
console.log('Message format version ' + String(Message.version) + ' with ' + String(Object.keys(Message.formats).length) + ' message formats.\n');

// print information about each message type
Object.keys(Message.formats).forEach(function(i) {
  var format = Message.formats[i];

  console.log('[' + i + '] ' + format.name + ', ' + String(Message.formatLength(format)) + ' bytes, multi-packet:', format.multipacket);
});
// for(var i = 0; i < Message.formats)
