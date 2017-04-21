import logger from './logger';
import _ from 'lodash';

const MESSAGE_TYPES = ['error', 'no data', 'regular', 'chunk', 'last chunk'];

const UNKNOWN_ERROR = {
  status: 13,
  value: 'Error parsing socket data from instruments'
};


/*
 * Object to contain the data received from the UI Automation system.
 */
class UIAutoResponse {
  constructor () {
    this.bufferedData = '';
    this.resultBuffer = '';
  }

  resetBuffer () {
    this.bufferedData = '';
  }

  addData (data) {
    this.bufferedData += data;
  }

  finalizeData () {
    let data = this.bufferedData;
    this.bufferedData = '';

    // try to figure out what type of data we have, and return it
    let parsedData;
    try {
      parsedData = {
        type: MESSAGE_TYPES[parseInt(data[0], 10)],
      };
      if (parsedData.type !== 'no data') {
        // format is <one char message type>,<DATA>
        parsedData.result = data.substring(2);
      }
    } catch (err) {
      logger.error(`Could not parse data from socket: ${err}`);
      logger.error(data);
      parsedData = {
        type: 'error',
        error: UNKNOWN_ERROR
      };
    }

    return parsedData;
  }

  getResult () {
    let data = this.finalizeData();

    if (!_.isUndefined(data.result) && data.result !== false) {
      // we have a result, try to make use of it
      if (data.result) {
        logger.debug(`Got result from instruments: ${data.result.slice(0, 300)}`);
      } else {
        logger.debug('Got null result from instruments');
      }

      if (data.type && data.type.indexOf('chunk') !== -1) {
        // a "chunk" of data, so add to our buffer
        this.resultBuffer += data.result;
        logger.debug(`Got chunk data, current resultBuffer length: ${this.resultBuffer.length}`);
        if (data.type === 'last chunk') {
          logger.debug(`This is the last data final length: ${this.resultBuffer.length}`);
          // this is the last row, unpack and return response
          let result;
          try {
            result = JSON.parse(this.resultBuffer);
          } catch (err) {
            logger.error(`Could not parse result buffer: ${err}`);
            result = UNKNOWN_ERROR;
          }
          this.resultBuffer = '';
          return result;
        } else {
          logger.debug('Not the last chunk, trying to get more');
          return {
            needsMoreData: true
          };
        }
      } else {
        // not a "chunk", so parse and return
        let result;
        try {
          result = JSON.parse(data.result);
        } catch (err) {
          logger.error(`Could not parse result buffer: ${err}`);
          result = UNKNOWN_ERROR;
        }
        return result;
      }
    } else {
      // we have no result
      return null;
    }
  }
}

export default UIAutoResponse;
