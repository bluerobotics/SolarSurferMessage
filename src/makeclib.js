var fs = require('fs');
var dir = 'output/';
var filename = 'Messages.h';

// init file contents
var clib = '';

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
