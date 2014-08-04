// import
var chai = require('chai');
var expect = chai.expect;
var Message = require('src/Message.js');

// common vars
// var config;
 
describe('Message', function() {
  var config;

  beforeEach(function(){
    config = {
      "version": "1",
      "shared": {
        "version": {
          "name": "version",
          "type": "uint8_t"
        },
        "format": {
          "name": "format",
          "type": "uint8_t"
        },
        "checksum": {
          "name": "checksum",
          "type": "uint16_t"
        }
      },
      "formats": {
        "0": {
          "name": "test/string",
          "payload": [
            "version",
            "format",
            {
              "name": "message",
              "type": "char",
              "qty": 46
            },
            "checksum"
          ]
        }
      }
    };

    // note to self: do not call Message.configure() because it is under test in this script
  });

  describe('the configure function', function() {
    it('should error if format does not have a name', function(){
      delete config.formats[0].name;
      expect(function(){
        Message.configure(config);
      }).to.throw(Message.FormatNameException);
    });

    it('should error if format does not have a payload', function(){
      delete config.formats[0].payload;
      expect(function(){
        Message.configure(config);
      }).to.throw(Message.FormatPayloadException);
    });

    it('should error if shared field cannot be found', function(){
      config.formats[0].payload[0] = 'bad shared field';
      expect(function(){
        Message.configure(config);
      }).to.throw(Message.FormatSharedFieldException);
    });

    it('should error if data type cannot be found', function(){
      config.formats[0].payload[2].type = 'bad data type';
      expect(function(){
        Message.configure(config);
      }).to.throw(Message.FormatDataTypeException);
    });

    it('should error if format payload length is larger than 340 bytes', function(){
      // 340 is the RockBlock / RockSevenCore API send limit
      // TODO: message TO the RockBlock can only be 270 bytes

      config.formats[0].payload[2].qty = 400;
      expect(function(){
        Message.configure(config);
      }).to.throw(Message.FormatLengthException);
    });

    it('should error if version is not the first field', function(){
      config.formats[0].payload.splice(0, 1);
      expect(function(){
        Message.configure(config);
      }).to.throw(Message.FormatRequiredFieldException);
    });

    it('should error if format is not the second field', function(){
      config.formats[0].payload.splice(1, 1);
      expect(function(){
        Message.configure(config);
      }).to.throw(Message.FormatRequiredFieldException);
    });

    it('should error if version is not the checksum field', function(){
      config.formats[0].payload.splice(-1, 1);
      expect(function(){
        Message.configure(config);
      }).to.throw(Message.FormatRequiredFieldException);
    });

    it('should not error for a valid config', function(){
      Message.configure(config);
    });
  });

  describe('the decode function', function() {
    var packet;

    beforeEach(function(){
      packet = '010054686520536f6c617253757266657220697320676f696e6720746f204861776169692120486f706566756c6c792e85f7';

      Message.configure(config);
    });

    it('should error a packet without the required fields', function(){
      expect(function(){
        // missing version, format, and checksum
        Message.decode('');
      }).to.throw(Message.DecodeLengthException);
    });

    it('should error if the version does not match', function(){
      expect(function(){
        // version is 0 (should be 1)
        Message.decode('00000000');
      }).to.throw(Message.DecodeVersionException);
    });

    it('should error if the format cannot be found', function(){
      expect(function(){
        // correct version (1), incorrect format (99)
        Message.decode('01990000');
      }).to.throw(Message.DecodeFormatException);
    });

    it('should error for an incorrect packet length', function(){
      expect(function(){
        // should be a full 50 bytes
        Message.decode(packet.substr(0, 48*2));
      }).to.throw(Message.DecodeLengthException);
    });

    it('should error if the checksum fails', function(){
      expect(function(){
        // checksum of 0000 is probably wrong...
        Message.decode(packet.substr(0, 48*2) + '0000');
      }).to.throw(Message.DecodeChecksumException);
    });

    it('should not error for a valid packet', function(){
      var message = Message.decode(packet);
      expect(message).to.deep.equal({
        version: 1,
        format: 0,
        message: 'The SolarSurfer is going to Hawaii! Hopefully.',
        checksum: 34295
      });
    });
  });

  describe('the decodeValue function', function() {
    it('should error if the data type is not found', function(){
      expect(function(){
        Message.decodeValue(0, 'uint5_t');
      }).to.throw(Message.DecodeValueException);
    });

    it('should convert a uint8_t to a number', function(){
      var output = Message.decodeValue('0a', 'uint8_t');
      expect(output).to.equal(10);
    });

    it('should convert a uint16_t to a number', function(){
      var output = Message.decodeValue('0a00', 'uint8_t');
      expect(output).to.equal(2560);
    });

    it('should convert a uint32_t to a number', function(){
      var output = Message.decodeValue('0a0000', 'uint8_t');
      expect(output).to.equal(655360);
    });

    it('should convert a uint64_t to a number', function(){
      var output = Message.decodeValue('0a000000', 'uint8_t');
      expect(output).to.equal(167772160);
    });
  });

  describe('the hexToBytes function', function() {
    it('should convert a string of hex characters to a byte array', function(){
      var hex = '4252'; // B(lue) R(robotics)
      var bytes = Message.hexToBytes(hex);
      expect(bytes).to.deep.equal([66, 82]);
    });
  });

  describe('the bytesToHex function', function() {
    it('should convert a byte array to a string of hex characters', function(){
      var bytes = [66, 82]; // B(lue) R(robotics)
      var hex = Message.bytesToHex(bytes);
      expect(hex).to.deep.equal('4252');
    });
  });

  describe('the hexToAscii function', function() {
    it('should convert a string of hex characters to an ascii string', function(){
      var hex = '4252'; // B(lue) R(robotics)
      var str = Message.hexToAscii(hex);
      expect(str).to.equal('BR');
    });
  });

  describe('the asciiToHex function', function() {
    it('should convert an ascii string to a string of hex characters', function(){
      var str = 'BR';
      var hex = Message.asciiToHex(str);
      expect(hex).to.equal('4252');
    });
  });

  describe('the formatLength function', function() {
    it('should calculate the total byte length from the individual fields', function(){
      Message.configure(config);
      expect(Message.formatLength(Message.formats[0])).to.equal(50);
    });
  });

  describe('the checksum function', function(){
    it('should produce correct crc16ccitt checksums', function(){
      var checksum = Message.checksum('9a');
      expect(checksum).to.equal('c303');
    });
  });

  describe('regressions', function() {
    beforeEach(function(){
      Message.loadConfigFile();
    });

    it('should decode 01039a99ecc29a99054201e803000002645a29054c0500000000000000000000000000000000000000000001000001009a50', function(){
      var data = '01039a99ecc29a99054201e803000002645a29054c0500000000000000000000000000000000000000000001000001009a50';
      // this should not throw an error
      Message.decode(data);
      console.log(Message.decode(data));
    });
  });

});
