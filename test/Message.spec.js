// import
var expect = require('expect.js');
var Message = require('src/Message.js');

// common vars
// var config;
 
describe('Message', function() {
  var config;

  beforeEach(function(done){
    config = {};
    done();
  });

  describe('the decode function', function() {
    // var post_data;

    beforeEach(function(done){
      Message.configure(config);
      done();
    });

    it('should throw an error for an incorrect correct packet length', function(done){
      // create msg
      comm.hex2a

      // send request
      request(api).post('/raw/tlm')
        .send(post_data)
        .expect(401, done);
    });
  });

  describe('the configure function', function() {
    // var post_data;

    // beforeEach(function(done){
    //   done();
    // });

    it('should complain if message length does not add up to 50', function(done){
      // create msg
      comm.hex2a

      // send request
      Message.configure(config);
    });
  });

});
