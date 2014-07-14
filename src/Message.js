var fs = require('fs');
var _ = require('lodash');

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

// custom exceptions
var custom_errors = [
  'FormatNameException',
  'FormatPayloadException',
  'FormatDataTypeException',
  'FormatRequiredFieldException',
  'FormatSharedFieldException',
  'FormatLengthException',
  'DecodeException'];
for(var i = 0; i < custom_errors.length; i++) {
  Message[custom_errors[i]] = function(message) { this.message = message; };
  Message[custom_errors[i]].prototype = new Error();
}

// custom decode exception
// Message.DecodeException = function(msg) {
//   this.msg = msg;
// };

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
      throw new Message.FormatNameException('Format "' + String(i) + '" should have a name');

    // it should have a payload
    if(format.payload === undefined)
      throw new Message.FormatPayloadException('Format "' + String(i) + '" should have a payload');

    // parse fields
    var sum = 0;
    for(var j = 0; j < format.payload.length; j++) {
      var field = format.payload[j];
      console.log(j, field)
      // expand share field
      if(typeof field == 'string') {
        var shared = config.shared[field];
        if(shared === undefined)
          throw new Message.FormatSharedFieldException('Shared field "' + field + '" not found');
        else field = _.clone(shared, true);
      }

      // set qty to 1
      if(field.qty === undefined)
        field.qty = 1;

      // check field type
      if(Message.types[field.type] === undefined)
        throw new Message.FormatDataTypeException('Field type "' + field.type + '" not found');

      // sum
      sum += field.qty * Message.types[field.type].size;

      // re-set in case this was originally a string
      format.payload[j] = field;
    }

    // make sure the length adds up to 50 bytes
    if(sum > 340)
      throw new Message.FormatLengthException('Format length "' + String(sum) + '" should be less than 340');

    // check required fields
    if(format.payload[0].name != 'version' || format.payload[1].type != 'uint8_t')
      throw new Message.FormatRequiredFieldException('Field "version" should be the first field in the format.');
    if(format.payload[1].name != 'format' || format.payload[1].type != 'uint8_t')
      throw new Message.FormatRequiredFieldException('Field "format" should be the second field in the format.');
    var last_idx = format.payload.length - 1;
    if(format.payload[last_idx].name != 'checksum' || format.payload[last_idx].type != 'uint16_t')
      throw new Message.FormatRequiredFieldException('Field "checksum" should be the last field in the format.');

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
    throw new Message.DecodeException('Bad packet length "' + String(packet.length) + '"');

  // all packets must have a version at 0
  var version = this.decodeBytes(packet.charAt(0), 'uint8_t');
  if(version != this.version)
    throw new Message.DecodeException('Unknown version "' + String(version) + '"');

  // all packets must have a format at 1
  var format_index = this.decodeBytes(packet.charAt(1), 'uint8_t');
  var format = this.formats[format_index];
  if(format === undefined)
    throw new Message.DecodeException('Unknown format "' + String(format_index) + '"');

  // all packets must have a checksum at 48 and 49
  var checksum = this.decodeBytes(packet.substring(48, 50), 'uint16_t');
  var actual_checksum = this.crc16(packet);
  if(checksum != actual_checksum)
    throw new Message.DecodeException('Checksum "' + String(checksum) + '" should be "' + String(actual_checksum) + '"');

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
