// transpile:mocha

import { IOSPerformanceLog } from '../..';
import sinon from 'sinon';
import _ from 'lodash';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';


chai.should();
chai.use(chaiAsPromised);

describe('performance logs', () => {
  let onTimelineEventCb;
  let log;
  let remote = {
    startTimeline: _.noop,
    stopTimeline: _.noop
  };
  let startTimelineStub;
  let stopTimelineStub;
  beforeEach(() => {
    startTimelineStub = sinon.stub(remote, 'startTimeline', async function (cb) { // eslint-disable-line promise/prefer-await-to-callbacks
      onTimelineEventCb = cb;
    });
    stopTimelineStub = sinon.stub(remote, 'stopTimeline');

    log = new IOSPerformanceLog(remote);
  });
  afterEach(() => {
    startTimelineStub.restore();
    stopTimelineStub.restore();
  });

  it('should be able to start the timeline listening', async () => {
    await log.startCapture();
    startTimelineStub.calledOnce.should.be.true;
  });

  it('should be able to stop the timeline listening', async () => {
    await log.startCapture();
    startTimelineStub.calledOnce.should.be.true;
    await log.stopCapture();
    stopTimelineStub.calledOnce.should.be.true;
  });

  it('should capture timeline events', async () => {
    await log.startCapture();

    let message = 'Some timeline event';
    onTimelineEventCb(message);

    (await log.getLogs()).should.eql([message]);
  });

  it('should consume timeline events when logs are retrieved', async () => {
    await log.startCapture();

    let message = 'Some timeline event';
    onTimelineEventCb(message);

    (await log.getLogs()).should.eql([message]);

    (await log.getLogs()).should.eql([]);
  });
});
