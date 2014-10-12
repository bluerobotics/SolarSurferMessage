// import
var chai = require('chai');
var expect = chai.expect;
var Message = require('../src/Message.js');

// common vars
// var config;
 
describe('Message', function() {
  var config, good_packet_raw, good_packet;

  beforeEach(function(){
    config = {
      "version": "1",
      "shared": {
        "version": {
          "name": "_version",
          "type": "uint8_t"
        },
        "format": {
          "name": "_format",
          "type": "uint8_t"
        },
        "checksum": {
          "name": "_checksum",
          "type": "hex",
          "qty": 2
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
        },
        "1": {
          "name": "test/conversion",
          "payload": [
            "version",
            "format",
            {
              "name": "num",
              "type": "uint8_t",
              "conversion": {
                "coeffs": [1, 2.2]
              }
            },
            "checksum"
          ]
        }
      }
    };
    good_packet_raw = '010054686520536f6c617253757266657220697320676f696e6720746f204861776169692120486f706566756c6c792ef785';
    good_packet = {
      _version: 1,
      _format: 0,
      message: 'The SolarSurfer is going to Hawaii! Hopefully.',
      _checksum: 'f785'
    };

    // note to self: do not call Message.configure() here because it is under test in this script
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

    it('should error if enum fields are configured correctly', function(){
      // TODO: check existence of map
      // TODO: check that map names are valid JS object attribute names
    });

    it('should error if bitmap fields are configured correctly', function(){
      // TODO: check existence of map
      // TODO: check that map names are valid JS object attribute names
    });

    it('should not error for a valid config', function(){
      Message.configure(config);
    });
  });

  describe('the decode function', function() {
    beforeEach(function(){
      Message.configure(config);
    });

    it('should error on a packet without the required fields', function(){
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
        Message.decode(good_packet_raw.substr(0, 48*2));
      }).to.throw(Message.DecodeLengthException);
    });

    it('should error if the checksum fails', function(){
      expect(function(){
        // checksum of 0000 is probably wrong...
        Message.decode(good_packet_raw.substr(0, 48*2) + '0000');
      }).to.throw(Message.DecodeChecksumException);
    });

    it('should not error for a valid packet', function(){
      var message = Message.decode(good_packet_raw);
      expect(message).to.deep.equal(good_packet);
    });

    it('should apply a conversion if supplied for number types', function(){
      var message = Message.decode('010101bcd8');
      expect(message.num).to.equal(3.2);
    });
  });

  describe('the decodeValue function', function() {
    it('should error if the data type is not found', function(){
      expect(function(){
        Message.decodeValue(0, 'uint5_t');
      }).to.throw(Message.DecodeValueException);
    });

    it('should decode a uint8_t', function(){
      var output = Message.decodeValue(new Buffer('01', 'hex'), 'uint8_t');
      expect(output).to.equal(1);
    });

    it('should decode a uint16_t', function(){
      var output = Message.decodeValue(new Buffer('0001', 'hex'), 'uint16_t');
      expect(output).to.equal(256);
    });

    it('should decode a uint32_t', function(){
      var output = Message.decodeValue(new Buffer('00000001', 'hex'), 'uint32_t');
      expect(output).to.equal(16777216);
    });

    it('should decode a int8_t', function(){
      var output = Message.decodeValue(new Buffer('01', 'hex'), 'int8_t');
      expect(output).to.equal(1);

      output = Message.decodeValue(new Buffer('ff', 'hex'), 'int8_t');
      expect(output).to.equal(-1);

      output = Message.decodeValue(new Buffer('80', 'hex'), 'int8_t');
      expect(output).to.equal(-Math.pow(2, 8-1));
    });

    it('should decode a int16_t', function(){
      var output = Message.decodeValue(new Buffer('0080', 'hex'), 'int16_t');
      expect(output).to.equal(-Math.pow(2, 16-1));
    });

    it('should decode a int32_t', function(){
      var output = Message.decodeValue(new Buffer('00000080', 'hex'), 'int32_t');
      expect(output).to.equal(-Math.pow(2, 32-1));
    });

    it('should decode a float', function(){
      var output = Message.decodeValue(new Buffer('c3f54840', 'hex'), 'float');
      expect(Math.abs(3.14-output)).to.be.below(0.001);
    });

    it('should decode a double', function(){
      var output = Message.decodeValue(new Buffer('1f85eb51b81e0940', 'hex'), 'double');
      expect(Math.abs(3.14-output)).to.be.below(0.001);
    });

    it('should decode an enum', function(){
      var map = {
        "0": "this",
        "1": 42
      };
      var output = Message.decodeValue(new Buffer('01', 'hex'), 'enum', map);
      expect(output).to.equal(42);
    });

    it('should decode a bitmap', function(){
      var map = {
        "0": "pos_name0",
        "1": "pos_name1",
        "2": "pos_name2"
      };
      var output = Message.decodeValue(new Buffer('06', 'hex'), 'bitmap', map);
      expect(output).to.deep.equal({
        pos_name0: false,
        pos_name1: true,
        pos_name2: true
      });
    });

    it('should convert a char to an ascii character', function(){
      var output = Message.decodeValue(new Buffer('68', 'hex'), 'char');
      expect(output).to.equal('h');
    });

    it('should pass through a hex string', function(){
      var output = Message.decodeValue(new Buffer('ab', 'hex'), 'hex');
      expect(output).to.equal('ab');
    });
  });

  describe('the encode function', function() {
    beforeEach(function(){
      delete good_packet._checksum;
      Message.configure(config);
    });

    it('should error on a packet without the required fields', function(){
      expect(function(){
        // missing version and format
        Message.encode({});
      }).to.throw(Message.EncodeMissingFieldException);
    });

    it('should error if the version does not match', function(){
      expect(function(){
        // version is 0 (should be 1)
        Message.encode({
          _version: 0,
          _format: 0
        });
      }).to.throw(Message.EncodeVersionException);
    });

    it('should error if the format cannot be found', function(){
      expect(function(){
        // correct version (1), incorrect format (99)
        Message.encode({
          _version: 1,
          _format: 99
        });
      }).to.throw(Message.EncodeFormatException);
    });

    it('should not error for a valid packet', function(){
      var message = Message.encode(good_packet);
      expect(message).to.equal(good_packet_raw);
    });

    // it('should apply a conversion if supplied for number types', function(){
    //   var message = Message.decode('010101bcd8');
    //   expect(message.num).to.equal(3.2);
    // });
  });

  describe('the encodeValue function', function() {

    it('should encode a uint8_t', function(){
      var output = Message.encodeValue(1, 'uint8_t');
      expect(output.toString('hex')).to.equal('01');
    });

    it('should encode a uint16_t', function(){
      var output = Message.encodeValue(256, 'uint16_t');
      expect(output.toString('hex')).to.equal('0001');
    });

    it('should encode a uint32_t', function(){
      var output = Message.encodeValue(16777216, 'uint32_t');
      expect(output.toString('hex')).to.equal('00000001');
    });

    it('should encode a int8_t', function(){
      var output = Message.encodeValue(-1, 'int8_t');
      expect(output.toString('hex')).to.equal('ff');
    });

    it('should encode a int16_t', function(){
      var output = Message.encodeValue(-Math.pow(2, 16-1), 'int16_t');
      expect(output.toString('hex')).to.equal('0080');
    });

    it('should encode a int32_t', function(){
      var output = Message.encodeValue(-Math.pow(2, 32-1), 'int32_t');
      expect(output.toString('hex')).to.equal('00000080');
    });

    it('should encode a float', function(){
      var buffer = Message.encodeValue(3.14, 'float');
      expect(buffer.toString('hex')).to.equal('c3f54840');
    });

    it('should encode a double', function(){
      var buffer = Message.encodeValue(3.14, 'double');
      expect(buffer.toString('hex')).to.equal('1f85eb51b81e0940');
    });

    it('should encode an enum', function(){
      var map = {
        "0": "this",
        "1": 42
      };
      var output = Message.encodeValue(42, 'enum', map);
      expect(output.toString('hex')).to.equal('01');
    });

    it('should encode a bitmap', function(){
      var map = {
        "0": "pos_name0",
        "1": "pos_name1",
        "2": "pos_name2"
      };
      var output = Message.encodeValue({
        pos_name0: false,
        pos_name1: true,
        pos_name2: true
      }, 'bitmap', map);
      expect(output.toString('hex')).to.equal('06');
    });

    it('should encode a char string', function(){
      var buffer = Message.encodeValue('hello', 'char');
      expect(buffer.toString('hex')).to.equal('68656c6c6f');
    });

    it('should pass through a hex string', function(){
      var buffer = Message.encodeValue(new Buffer('ab', 'hex'), 'hex');
      expect(buffer.toString('hex')).to.equal('ab');
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
      var checksum = Message.checksum(new Buffer('9a', 'hex'));
      expect(checksum.toString('hex')).to.equal('03c3');
    });
  });

  describe('regressions', function() {
    beforeEach(function(){
      Message.loadConfigFile();
    });

    it('should decode 02029A99ECC29A99054201E803000002645A29054C050000000000000000000000000000000000000000000100000100B078', function(){
      var data = '02029A99ECC29A99054201E803000002645A29054C050000000000000000000000000000000000000000000100000100B078';
      // this should not throw an error
      Message.decode(data);
    });

    it('should decode 020202000A9133030000000000000000000000000000000000000000000000000000000000000000000000000000000018A6', function(){
      var data = '020202000A9133030000000000000000000000000000000000000000000000000000000000000000000000000000000018A6';
      // this should not throw an error
      Message.decode(data);
    });

    it('should encode this object', function(){
      var data = {
        _version: 2,
        _format: 4,
        telemetryPeriod: '10',
        forceMode: { ThrusterOff: false, ForceHeading: false, ForceHoldPosition: false, ForceSeaweedRemoval: false },
        forceHeading: 14.0625,
        goalVoltage: 13.201,
        forceCurrentWaypointIndex: 3,
        waypointID1: 0,
        waypointRadius1: 0,
        waypointLat1: 0,
        waypointLon1: 0,
        waypointID2: 0,
        waypointRadius2: 0,
        waypointLat2: 0,
        waypointLon2: 0,
        waypointID3: 0,
        waypointRadius3: 0,
        waypointLat3: 0,
        waypointLon3: 0,
        waypointID4: 0,
        waypointRadius4: 0,
        waypointLat4: 0,
        waypointLon4: 0
      };
      // this should not throw an error
      var packet = Message.encode(data);

      expect(packet).to.equal('020403000a91330300000000000000000000000000000000000000000000000000000000000000000000000000000000ef82');
    });
  });

});
