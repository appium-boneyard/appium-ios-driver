// transpile:mocha

import { outputStream, errorStream, webSocketAlertStream, dumpStream } from '../../../lib/instruments/streams';
import Stream from 'stream';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import B from 'bluebird';
import sinon from 'sinon';


chai.should();
chai.use(chaiAsPromised);

describe('streams', function () {
  async function runThroughStream (stream, text) {
    return new B(function (resolve) {
      stream.on('data', (data) => {
        resolve(data);
      });
      stream.write(text);
    });
  }

  describe('outputStream', function () {
    let stream;
    beforeEach(function () {
      stream = outputStream();
    });
    it('should return a stream', function () {
      stream.should.be.an.instanceof(Stream);
    });
    it('should append [INST] to the output', async function () {
      let text = 'Some output';
      let output = await runThroughStream(stream, text);

      output.should.include('[INST] Some output');
    });
    it('should remove beginning * from output', async function () {
      let text = '***Some output***';
      let output = await runThroughStream(stream, text);

      output.should.include('Some output***');
    });
    it('should remove final newlines', async function () {
      let text = 'Some output\n';
      let output = await runThroughStream(stream, text);

      output.should.not.include('\n');
    });
    it('should indent internal newlines', async function () {
      let text = 'Some output\non multiple lines';
      let output = await runThroughStream(stream, text);

      output.should.include('Some output\n       on multiple lines');
    });
  });
  describe('errorStream', function () {
    let stream;
    beforeEach(function () {
      stream = errorStream();
    });
    it('should return a stream', function () {
      stream.should.be.an.instanceof(Stream);
    });
    it('should append [INST STDERR] to the output', async function () {
      let text = 'Some output';
      let output = await runThroughStream(stream, text);

      output.should.include('[INST STDERR] Some output');
    });
    it('should remove beginning * from output', async function () {
      let text = '***Some output***';
      let output = await runThroughStream(stream, text);

      output.should.include('Some output***');
    });
    it('should remove final newlines', async function () {
      let text = 'Some output\n';
      let output = await runThroughStream(stream, text);

      output.should.not.include('\n');
    });
  });
  describe('webSocketAlertStream', function () {
    let webSocket = {
      sockets: {
        emit: () => {}
      }
    };
    let webSocketSpy = sinon.spy(webSocket.sockets, 'emit');

    afterEach(function () {
      webSocketSpy.resetHistory();
    });

    it('should return a stream', function () {
      webSocketAlertStream().should.be.an.instanceof(Stream);
    });
    it('should queue data', async function () {
      let text = 'Some output';
      let output = await runThroughStream(webSocketAlertStream(), text);

      output.should.equal(text);
    });
    it('should send data to websocket when appropriate', async function () {
      let text = 'Call to onAlert returned \'YES\'\nSome output';

      await runThroughStream(webSocketAlertStream(webSocket), text);

      webSocketSpy.calledWith('alert', {message: text});
    });
    it('should not send data to websocket when inappropriate', async function () {
      let text = 'Some output';

      await runThroughStream(webSocketAlertStream(webSocket), text);

      webSocketSpy.called.should.be.false;
    });
  });
  describe('dumpStream', function () {
    let stream;
    beforeEach(function () {
      stream = dumpStream();
    });
    it('should return a stream', function () {
      stream.should.be.an.instanceof(Stream);
    });
  });
});
