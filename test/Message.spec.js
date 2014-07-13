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
          "type": "uint8_t"
        },
        "format": {
          "type": "uint8_t"
        },
        "checksum": {
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

    it('should error if format payload length is not 50 bytes', function(){
      config.formats[0].payload[2].qty = 40;
      expect(function(){
        Message.configure(config);
      }).to.throw(Message.FormatLengthException);
    });
  });

  describe('the decode function', function() {
    // var post_data;

    beforeEach(function(){
      Message.configure(config);
    });

    // it('should throw an error for an incorrect correct packet length', function(done){
    //   // create msg
    //   comm.hex2a

    //   // send request
    //   request(api).post('/raw/tlm')
    //     .send(post_data)
    //     .expect(401, done);
    // });
  });

});
