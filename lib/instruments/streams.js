import log from './logger';
import through from 'through';


function clearBufferChars (output) {
  // Instruments output is buffered, so for each log output we also output
  // a stream of very many ****. This function strips those out so all we
  // get is the log output we care about
  let re = /(\n|^)\*+\n?/g;
  output = output.toString();
  output = output.replace(re, '');
  return output;
}

function outputStream () {
  return through(function outputStreamHandler (output) {
    output = clearBufferChars(output);

    // if we have multiple log lines, indent non-first ones
    if (output !== '') {
      // get rid of newline at the end
      output = output.replace(/\n$/m, '');
      // indent instead of newline
      output = output.replace(/\n/m, '\n       ');
      output = `[INST] ${output}`;
      output = output.green;
      log.debug(output);
    }
    this.queue(output);
  });
}

function errorStream () {
  return through(function errorStreamHandler (output) {
    // get rid of newline at the end
    output = output.replace(/\n$/m, '');
    output = (`[INST STDERR] ${output}`);
    output = output.yellow;
    log.debug(output);
    this.queue(output);
  });
}

function webSocketAlertStream (webSocket) {
  return through(function webSocketAlertStreamHandler (output) {
    if (webSocket) {
      let re = /Call to onAlert returned 'YES'/;
      if (re.test(output)) {
        log.debug('Emiting alert message...');
        webSocket.sockets.emit('alert', {message: output});
      }
    }
    this.queue(output);
  });
}

function dumpStream () {
  return through(function nullStreamHandler () { /* ignore all stream output */});
}

export { outputStream, errorStream, webSocketAlertStream, dumpStream };
