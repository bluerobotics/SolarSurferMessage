var fs = require('fs');
var _ = require('lodash');
var crc = require('crc');

// declare static class
function Message() {}

// default config
Message.version = undefined;
Message.formats = {};
Message.types = {
  'uint8_t': {'size': 1},
  'uint16_t': {'size': 2},
  'uint32_t': {'size': 4},
  'uint64_t': {'size': 8},
  'int8_t': {'size': 1},
  'int16_t': {'size': 2},
  'int32_t': {'size': 4},
  'int64_t': {'size': 8},
  'float': {'size': 4},
  'double': {'size': 8},
  'enum': {'size': 1},
  'bitmap': {'size': 1},
  'char': {'size': 1}
};

// custom exceptions
var custom_errors = [
  'FormatNameException',
  'FormatPayloadException',
  'FormatDataTypeException',
  'FormatRequiredFieldException',
  'FormatSharedFieldException',
  'FormatLengthException',
  'DecodeLengthException',
  'DecodeVersionException',
  'DecodeFormatException',
  'DecodeChecksumException',
  'DecodeValueException'];
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
    for(var j = 0; j < format.payload.length; j++) {
      var field = format.payload[j];
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

      // re-set in case this was originally a string
      format.payload[j] = field;
    }

    // make sure the length is less than 340 for message to the RockBlock
    var sum = this.formatLength(format);
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
Message.decode = function(packet_hex_string) {
  // convert to byte array
  packet = this.hexToBytes(packet_hex_string);

  // incoming packet must be a 50-character byte array
  if(packet.length < 4)
    throw new Message.DecodeLengthException('All packets must be at least 4 bytes long');

  // all packets must have a version at 0
  var version = this.decodeValue(packet[0], 'uint8_t');
  if(version != this.version)
    throw new Message.DecodeVersionException('Unknown version "' + String(version) + '"');

  // all packets must have a format at 1
  var format_index = this.decodeValue(packet[1], 'uint8_t');
  var format = this.formats[format_index];
  if(format === undefined)
    throw new Message.DecodeFormatException('Unknown format "' + String(format_index) + '"');

  // check packet length matches format length
  var expected_length = this.formatLength(format);
  if(packet.length != expected_length)
    throw new Message.DecodeLengthException('Packet length "' + String(packet.length) + '" should be "' + String(expected_length) + '"');

  // all packets must have a checksum as the last two bytes
  var checksum = this.bytesToHex(packet.slice(packet.length-2), 'uint16_t');
  var actual_checksum = crc.crc16ccitt(this.bytesToHex(packet.slice(0, packet.length-2)));
  if(checksum != actual_checksum)
    throw new Message.DecodeChecksumException('Checksum "' + checksum + '" should be "' + actual_checksum + '"');

  // expand packet
  var message = {};
  for(var i = 0; i < format.payload.length; i++) {
    var field = format.payload[i];
    var data_type_size = Message.types[field.type].size;

    // decode field values
    message[field.name] = [];
    for(var j = 0; j < field.qty; j++) {
      var raw = packet.splice(0, data_type_size);
      message[field.name].push(this.decodeValue(this.bytesToHex(raw), field.type));
    }

    // flatten if qty is one
    if(field.qty == 1)
      message[field.name] = message[field.name][0];

    // concat string types
    else if(field.type == 'char')
      message[field.name] = message[field.name].join('');
  }

  // special image handling - cache pieces and only return image once all are collected
  // if()

  // return decoded message
  return message;
};

Message.decodeValue = function(input, type) {
  if(Message.types[type] === undefined)
    throw new Message.DecodeValueException('Unknown data type "' + String(type) + '"');

  // unsigned integer types
  if(type.substr(0, 4) == 'uint')
    return input;
  else if(type == 'char')
    return this.hexToAscii(input);
};

Message.hexToBytes = function(hex) {
  // force conversion
  hex = hex.toString();

  var bytes = [];
  for (var i = 0; i < hex.length; i += 2)
    bytes.push(parseInt(hex.substr(i, 2), 16));

  return bytes;
};

Message.bytesToHex = function(bytes) {
  var hex = '';
  for (var i = 0; i < bytes.length; i ++)
    hex += bytes[i].toString(16);

  return hex;
};

Message.hexToAscii = function(hex) {
  // force conversion
  hex = hex.toString();

  var str = '';
  for (var i = 0; i < hex.length; i += 2)
    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));

  return str;
};

Message.asciiToHex = function(str) {
  var arr = [];
  for (var i = 0, l = str.length; i < l; i ++) {
    var hex = Number(str.charCodeAt(i)).toString(16);
    arr.push(hex);
  }

  return arr.join('');
};

Message.formatLength = function(format) {
    var sum = 0;

    for(var i = 0; i < format.payload.length; i++)
      sum += format.payload[i].qty * Message.types[format.payload[i].type].size;

    return sum;
};

// node export
module.exports = Message;
