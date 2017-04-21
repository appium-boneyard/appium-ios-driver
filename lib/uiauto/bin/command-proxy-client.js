#!/usr/bin/env node

// This script is used by the UIAuto job, running on Instruments, to connect
// to the Command Proxy. It transmits the Instruments messages exactly as they
// come in. Because stderr is unreliable, we append logs and program output
// before sending them to the UIAuto script in the following form:
// ----- LOGS -----
// blah blah blah...
// blah blah blah...
// ----- OUTPUT -----
// <OUTPUT>

// This script is run on the device, and as such is not ES6. Problems can
// ensue if it is transpiled.

"use strict";

var net = require('net');

var output = '';

function exit (status) {
  console.log('----- OUTPUT -----');
  console.log(output);
  // chill out before exiting
  process.nextTick(function () {
    process.exit(status);
  });
}

function connect (sock, dataFromInstruments) {
  var client = net.connect({path: sock}, function () {
    if (dataFromInstruments && dataFromInstruments.length > 0){
      console.log('Data from instruments to command proxy:');
      console.log(dataFromInstruments.substring(0, 100));
    }
    client.end(dataFromInstruments, "utf8");
  });
  client.setEncoding('utf8');
  client.on('data', function (dataFromCommandProxy) {
    console.log('Data from command proxy to instruments: ' + dataFromCommandProxy);
    output += dataFromCommandProxy;
  });
  client.on('error', function (err) {
    console.log('Error from command proxy to instruments: ' + err);
  });
  client.on('end', function () {
    client.end();
    exit(0);
  });
}

try {
  console.log('----- LOGS -----');
  connect(process.argv[2], process.argv[3]);
} catch (err) {
  console.log('An error occured: ' + (err || "").toString());
  exit(1);
}
// });

