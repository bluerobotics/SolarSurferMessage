var fs = require('fs');

// declare static class
function Message() {}

// default config
Message.version = undefined;
Message.formats = {};
Message.types = {
  "uint8_t": {"size": 1},
  "uint16_t": {"size": 2},
  "uint32_t": {"size": 4},
  "uint64_t": {"size": 8},
  "int8_t": {"size": 1},
  "int16_t": {"size": 2},
  "int32_t": {"size": 4},
  "int64_t": {"size": 8},
  "float": {"size": 4},
  "double": {"size": 8},
  "enum": {"size": 1},
  "bitmap": {"size": 1},
  "char": {"size": 1}
};

// custom configure exception
Message.ConfigureException = function(msg) {
  this.msg = msg;
};

// custom decode exception
Message.DecodeException = function(msg) {
  this.msg = msg;
};

// custom decode exception
Message.loadConfigFile = function(file) {
  if(file === undefined) file = 'src/formats.json';
  var config = fs.readFileSync(file, 'utf8');
  this.configure(JSON.parse(config));
};

// load message formats
Message.configure = function(config) {
  // set version
  this.version = config.version;

  // build formats
  this.formats = {};
  Object.keys(config.formats).forEach(function(i) {
    var format = config.formats[i];

    // it should have a name
    if(format.name === undefined)
      throw new Message.ConfigureException('Format ' + String(i) + ' should have a name');

    // it should have a payload
    if(format.payload === undefined)
      throw new Message.ConfigureException('Format ' + String(i) + ' should have a name');

    // expand shared fields
    // for(var i = 0; i < config.formats; i++) {
    // }

    // make sure the length adds up to 50 bytes

    // save format to class
    this.formats[i] = format;
  }, this);
};

// encode message
Message.encode = function(message) {
  var packets = [];
  return packets;
};

// decode message
Message.decode = function(packet) {
  // incoming packet must be a 50-character byte array
  if(packet.length != 50)
    throw new Message.DecodeException('Bad packet length ' + String(packet.length));

  // all packets must a version at 0
  var version = this.decodeBytes(packet.charAt(0), 'uint8_t');
  if(version != this.version)
    throw new Message.DecodeException('Unknown version ' + String(version));

  // all packets must a format at 1
  var format_index = this.decodeBytes(packet.charAt(1), 'uint8_t');
  var format = this.formats[format_index];
  if(format === undefined)
    throw new Message.DecodeException('Unknown format ' + String(format_index));

  // all packets must a checksum at 48 and 49
  var checksum = this.decodeBytes(packet.substring(48, 50), 'uint16_t');
  var actual_checksum = this.crc16(packet);
  if(checksum != actual_checksum)
    throw new Message.DecodeException('Checksum ' + String(checksum) + ' should be ' + String(actual_checksum));

  // special image handling
  // if()

  // expand packet
  var message = {};
  for(var i = 0; i < format.payload.length; i++) {
    // tbd
  }

  // return decoded message
  return {};
};

//         hex2a: function (hexx) {
//           var hex = hexx.toString();//force conversion
//           var str = '';
//           for (var i = 0; i < hex.length; i += 2)
//           str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
//           return str;
//         },
//         a2hex: function (str) {
//           var arr = [];
//           for (var i = 0, l = str.length; i < l; i ++) {
//           var hex = Number(str.charCodeAt(i)).toString(16);
//           arr.push(hex);
//           }
//           return arr.join('');
//         }

// export the app factory for the test package
module.exports = Message;
