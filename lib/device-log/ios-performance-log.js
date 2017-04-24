import logger from './logger';
import _ from 'lodash';

const MAX_EVENTS = 5000;

class IOSPerformanceLog {
  constructor (remoteDebugger, maxEvents = MAX_EVENTS) {
    this.remoteDebugger = remoteDebugger;
    this.maxEvents = parseInt(maxEvents, 10);

    this.timelineEvents = [];
  }

  async startCapture () {
    logger.debug('Starting performance (Timeline) log capture');
    this.timelineEvents = [];
    return await this.remoteDebugger.startTimeline(this.onTimelineEvent.bind(this));
  }

  async stopCapture () {
    logger.debug('Stopping performance (Timeline) log capture');
    return await this.remoteDebugger.stopTimeline();
  }

  onTimelineEvent (event) {
    logger.debug(`Received Timeline event: ${_.truncate(JSON.stringify(event))}`);
    this.timelineEvents.push(event);

    // if we have too many, get rid of the oldest log line
    if (this.timelineEvents.length > this.maxEvents) {
      let removedEvent = this.timelineEvents.shift();
      logger.warn(`Too many Timeline events, removing earliest: ${_.truncate(JSON.stringify(removedEvent))}`);
    }
  }

  async getLogs () {
    let events = this.timelineEvents;

    // flush events
    logger.debug('Flushing Timeline events');
    this.timelineEvents = [];

    return events;
  }

  async getAllLogs () {
    return this.getLogs();
  }
}

export default IOSPerformanceLog;
