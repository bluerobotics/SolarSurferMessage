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

  // print information about each field in this message type
  var pos = 0;
  Object.keys(format.payload).forEach(function(j) {
  	var payload = format.payload[j];
  	var comment = payload.comment ? ' [' + payload.comment + ']' : '';

  	console.log('\t' + pos + '-' + (pos+Message.payloadLength(payload)-1) + ':    \t' + payload.name + ' (' + payload.type + ')' + comment);

  	pos += Message.payloadLength(payload);
  });

});
