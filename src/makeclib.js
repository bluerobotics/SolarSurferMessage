// load modules
var fs = require('fs');
var Message = require('src/Message.js');
Message.loadConfigFile();

// variables
var dir = 'output/';
var filename = 'Messages.h';

// init file contents
var clib = '';

// build header filer
Object.keys(Message.formats).forEach(function(i) {
  var format = Message.formats[i];
  clib += format.name + '\n';
});

// create output directory
fs.mkdir(dir, function(e){
  if(!e || (e && e.code === 'EEXIST')) {
    // it already exists... cool
  } else {
    console.log(e);
  }
});

// write 
fs.writeFileSync(dir+filename, clib+'\n');
