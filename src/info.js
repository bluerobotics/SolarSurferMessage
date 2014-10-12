// load modules
var fs = require('fs');
var colors = require('colors');
var Message = require('./Message.js');
Message.loadConfigFile();

// print header information
console.log('Message format version ' + String(Message.version) + ' with ' + String(Object.keys(Message.formats).length) + ' message formats.\n');

// print information about each message type
Object.keys(Message.formats).forEach(function(i) {
  var format = Message.formats[i];

  console.log(colors.white('[' + i + '] ' + format.name + ', ' + String(Message.formatLength(format)) + ' bytes, multi-packet:', format.multipacket + ', commandable:', format.commandable));

  // print information about each field in this message type
  var pos = 0;
  Object.keys(format.payload).forEach(function(j) {
  	var payload = format.payload[j];
    var conversion = payload.conversion ? ' [' + payload.conversion.encoded_units + '] ' : '';
    var array = payload.qty>1 ? '[' + payload.qty + ']' : '';

  	console.log(colors.grey('\t' + pos + '-' + (pos+Message.payloadLength(payload)-1) + ':    \t' + payload.name + array + ' (' + payload.type + ')' + conversion));
    if(payload.comment) console.log(colors.cyan('\t\t\t  [' + payload.comment + '] '));

  	pos += Message.payloadLength(payload);
  });

});
