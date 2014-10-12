;(function() {
'use strict';

var factory = function(_) {
  // declare static class
  function Message() {}

  // default config
  Message.version = undefined;
  Message.formats = {};
  Message.types = {
    'uint8_t': {'size': 1},
    'uint16_t': {'size': 2},
    'uint32_t': {'size': 4},
    'int8_t': {'size': 1},
    'int16_t': {'size': 2},
    'int32_t': {'size': 4},
    'float': {'size': 4},
    'double': {'size': 8},
    'enum': {'size': 1},
    'bitmap': {'size': 1},
    'char': {'size': 1},
    'hex': {'size': 1}
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
    'DecodeValueException',
    'EncodeMissingFieldException',
    'EncodeVersionException',
    'EncodeFormatException',
    'EncodeValueException',
    'EncodeConversionTooComplicated'];
  for(var i = 0; i < custom_errors.length; i++) {
    Message[custom_errors[i]] = Error.extend(custom_errors[i]);
  }

  // custom decode exception
  Message.loadConfigFile = function(file) {
    if(file === undefined) file = __dirname + '/formats.json';
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

      if(format.multipacket !== true)
        format.multipacket = false;

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
      if(format.payload[0].name != '_version' || format.payload[1].type != 'uint8_t')
        throw new Message.FormatRequiredFieldException('Field "version" should be the first field in the format.');
      if(format.payload[1].name != '_format' || format.payload[1].type != 'uint8_t')
        throw new Message.FormatRequiredFieldException('Field "format" should be the second field in the format.');
      var last_idx = format.payload.length - 1;
      if(format.payload[last_idx].name != '_checksum' || format.payload[last_idx].type != 'hex')
        throw new Message.FormatRequiredFieldException('Field "checksum" should be the last field in the format.');

      // save format to class
      this.formats[i] = format;
    }, this);
  };

  // decode message
  Message.decode = function(hex) {
    // convert to byte array
    var packet = new Buffer(hex, 'hex');

    // incoming packet must be a 50-character byte array
    if(packet.length < 4)
      throw new Message.DecodeLengthException('All packets must be at least 4 bytes long');

    // all packets must have a version at 0
    var version = this.decodeValue(packet.slice(0, 1), 'uint8_t');
    if(version != this.version)
      throw new Message.DecodeVersionException('Unknown version "' + String(version) + '"');

    // all packets must have a format at 1
    var format_index = this.decodeValue(packet.slice(1, 2), 'uint8_t');
    var format = this.formats[format_index];
    if(format === undefined)
      throw new Message.DecodeFormatException('Unknown format "' + String(format_index) + '"');

    // check packet length matches format length
    var expected_length = this.formatLength(format);
    if(packet.length != expected_length)
      throw new Message.DecodeLengthException('Packet length "' + String(packet.length) + '" should be "' + String(expected_length) + '"');

    // all packets must have a checksum as the last two bytes
    var checksum = packet.slice(packet.length-2).toString('hex');
    var actual_checksum = Message.checksum(packet.slice(0, packet.length-2)).toString('hex');
    if(checksum != actual_checksum)
      throw new Message.DecodeChecksumException('Checksum "' + checksum + '" should be "' + actual_checksum + '"');

    // expand packet
    var message = {};
    var pos = 0;
    for(var i = 0; i < format.payload.length; i++) {
      var field = format.payload[i];
      var data_type_size = Message.types[field.type].size;

      // decode field values
      message[field.name] = [];
      for(var j = 0; j < field.qty; j++) {
        var raw = packet.slice(pos, pos+data_type_size);
        pos += data_type_size;

        // decode (with map, if applicable)
        var decoded;
        if(field.type == 'enum')
          decoded = this.decodeValue(raw, field.type, field.enum);
        else if(field.type == 'bitmap')
          decoded = this.decodeValue(raw, field.type, field.bitmap);
        else
          decoded = this.decodeValue(raw, field.type);

        // apply conversion if applicable
        if(field.conversion !== undefined && field.conversion.coeffs !== undefined) {
          var x = decoded, y = 0;
          for(var k = 0; k < field.conversion.coeffs.length; k++) {
            y += Math.pow(x, k) * field.conversion.coeffs[k];
          }
          decoded = y;
        }

        // save value
        message[field.name].push(decoded);
      }

      // flatten if qty is one
      if(field.qty == 1)
        message[field.name] = message[field.name][0];

      // concat string types
      else if(field.type == 'char' || field.type == 'hex')
        message[field.name] = message[field.name].join('');
    }

    // TODO: special image handling - cache pieces and only return image once all are collected

    // return decoded message
    return message;
  };

  Message.decodeValue = function(buffer, type, map) {
    // unsigned integer types
    if(type == 'uint8_t') return buffer.readUInt8(0);
    else if(type == 'uint16_t') return buffer.readUInt16LE(0);
    else if(type == 'uint32_t') return buffer.readUInt32LE(0);

    // signed integer types
    else if(type == 'int8_t') return buffer.readInt8(0);
    else if(type == 'int16_t') return buffer.readInt16LE(0);
    else if(type == 'int32_t') return buffer.readInt32LE(0);

    // floating point types
    else if(type == 'float') return buffer.readFloatLE(0);
    else if(type == 'double') return buffer.readDoubleLE(0);

    // map types
    else if(type == 'enum') {
      var index = buffer.readUInt8(0);
      if(map[index] === undefined) throw new Message.DecodeValueException('Unpopulated enum index "' + String(index) + '"');
      else return map[index];
    }
    else if(type == 'bitmap') {
      var value = buffer.readUInt8(0);
      var keys = Object.keys(map);
      var obj = {};
      for(var i = 0; i < keys.length; i++)
        obj[map[keys[i]]] = !!(value & Math.pow(2, parseInt(keys[i])));
      return obj;
    }

    // string types
    else if(type == 'char') return buffer.toString('ascii');
    else if(type == 'hex') return buffer.toString('hex');

    // error for unknown
    else throw new Message.DecodeValueException('Unknown data type "' + String(type) + '"');
  };

  // encode message
  Message.encode = function(message) {
    // all packets must have a version
    if(message._version === undefined)
      throw new Message.EncodeMissingFieldException('Field "_version" must be present');
    if(message._version != this.version)
      throw new Message.EncodeVersionException('Unknown version "' + String(message._version) + '"');

    // all packets must have a format at 1
    if(message._format === undefined)
      throw new Message.EncodeMissingFieldException('Field "_format" must be present');
    var format = this.formats[message._format];
    if(format === undefined)
      throw new Message.EncodeFormatException('Unknown format "' + String(message._format) + '"');

    // compress packet
    var buffer = new Buffer(Message.formatLength(format));
    var pos = 0;
    for(var i = 0; i < format.payload.length; i++) {
      var field = format.payload[i];
      var data_type_size = Message.types[field.type].size;

      // encode field values
      for(var j = 0; j < field.qty; j++) {
        var encoded;

        if(field.name != '_checksum') {
          // make sure field is present
          if(message[field.name] === undefined)
            throw new Message.EncodeMissingFieldException('Field "' + field.name + '" must be present');

          // extract field value
          var raw;
          if(field.qty == 1) raw = message[field.name];
          else raw = message[field.name][j];

          // apply conversion if applicable
          if(field.conversion !== undefined && field.conversion.coeffs !== undefined) {
            if(field.conversion.coeffs.length == 1)
              raw = raw / field.conversion.coeffs[0]; // not sure this makes sense or is even useful
            else if(field.conversion.coeffs.length == 2)
              raw = (raw - field.conversion.coeffs[0]) / field.conversion.coeffs[1];
            else
              throw new Message.EncodeConversionTooComplicated('I cannot encode a polynomial of degree "' + String(field.conversion.coeffs.length) + '"');
          }

          // encode (with map, if applicable)
          if(field.type == 'enum')
            encoded = this.encodeValue(raw, field.type, field.enum);
          else if(field.type == 'bitmap')
            encoded = this.encodeValue(raw, field.type, field.bitmap);
          else
            encoded = this.encodeValue(raw, field.type);
        }

        // save value
        encoded.copy(buffer, pos);
        pos += data_type_size;
      }
    }

    // checksum
    var checksum = Message.checksum(buffer.slice(0, buffer.length-2));
    checksum.copy(buffer, buffer.length-checksum.length);

    // TODO: special image handling

    // return encoded message
    return buffer.toString('hex');
  };

  Message.encodeValue = function(value, type, map) {
    var buffer, keys, i;

    // unsigned integer types
    if(type == 'uint8_t') {
      buffer = new Buffer(1);
      buffer.writeUInt8(value, 0);
    }
    else if(type == 'uint16_t') {
      buffer = new Buffer(2);
      buffer.writeUInt16LE(value, 0);
    }
    else if(type == 'uint32_t') {
      buffer = new Buffer(4);
      buffer.writeUInt32LE(value, 0);
    }

    // signed integer types
    else if(type == 'int8_t') {
      buffer = new Buffer(1);
      buffer.writeInt8(value, 0);
    }
    else if(type == 'int16_t') {
      buffer = new Buffer(2);
      buffer.writeInt16LE(value, 0);
    }
    else if(type == 'int32_t') {
      buffer = new Buffer(4);
      buffer.writeInt32LE(value, 0);
    }

    // floating point types
    else if(type == 'float') {
      buffer = new Buffer(4);
      buffer.writeFloatLE(value, 0);
    }
    else if(type == 'double') {
      buffer = new Buffer(8);
      buffer.writeDoubleLE(value, 0);
    }

    // map types
    else if(type == 'enum') {
      var index;
      keys = Object.keys(map);
      for(i = 0; i < keys.length; i++) {
        if(map[keys[i]] == value) index = keys[i];
      }
      if(index === undefined) throw new Message.EncodeValueException('No enum index for value "' + value + '"');

      buffer = new Buffer(1);
      buffer.writeUInt8(index, 0);
    }
    else if(type == 'bitmap') {
      var bitmap = 0;
      keys = Object.keys(map);
      for(i = 0; i < keys.length; i++) {
        var key = map[keys[i]];
        if(value[key] === undefined) throw new Message.EncodeValueException('Bitmap key "' + String(key) + '" not found');
        if(value[key]) bitmap += Math.pow(2, parseInt(keys[i]));
      }

      buffer = new Buffer(1);
      buffer.writeUInt8(bitmap, 0);
    }

    // string types
    else if(type == 'char') buffer = new Buffer(value, 'ascii');
    else if(type == 'hex') buffer = new Buffer(value, 'hex');

    // error for unknown
    else throw new Message.EncodeValueException('Unknown data type "' + String(type) + '"');

    return buffer;
  };

  Message.formatLength = function(format) {
    var sum = 0;

    for(var i = 0; i < format.payload.length; i++)
      sum += format.payload[i].qty * Message.types[format.payload[i].type].size;

    return sum;
  };

  Message.payloadLength = function(payload) {
    return Message.types[payload.type].size*payload.qty;
  };

  Message.checksum = function(buffer) {
    // big endian uint16_t
    var checksum = new Buffer(crc.crc16ccitt(buffer), 'hex');

    // convert to little endian uint16_t
    var convert = new Buffer(2);
    convert.writeUInt16LE(checksum.readUInt16BE(0), 0);
    return convert;
  };

  return Message;
};

// build with node
if(typeof(module) !== 'undefined') {
  // dependencies
  var fs = require('fs');
  var _ = require('lodash');
  var crc = require('crc'); // https://github.com/alexgorbatchev/node-crc
  require('extend-error');
  // Node Buffer lib: http://nodejs.org/docs/v0.6.0/api/buffers.html
  // Helpful CRC checker: http://www.lammertbies.nl/comm/info/crc-calculation.html

  // build lib
  var Message = factory(_);

  // node export
  module.exports = Message;
}

// console.log('window is', window)

// build with angular
if(typeof(window) !== 'undefined') {
  // must include lodash as window._
  window.Message = factory(window._);
}

})();
