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

  describe('the hexToBytes function', function() {
    it('should convert a string of hex characters to a byte array', function(){
      var hex = '4252'; // B(lue) R(robotics)
      var bytes = Message.hexToBytes(hex);
      expect(bytes).to.deep.equal([66, 82]);
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

});
