import env from './env';
import uuidGenerator from 'node-uuid';

const CHROMES = ['chrome', 'chromium', 'chromebeta', 'browser'];
const BROWSERS = CHROMES.concat(['safari']);

async function spinTitle (expTitle, browser, timeout = 90, _curTitle = undefined) {
  if (timeout <= 0) {
    throw new Error(`Title never became '${expTitle}'. Last known title was '${_curTitle}'`);
  }

  let pageTitle = await browser.title();
  if (pageTitle.indexOf(expTitle) < 0) {
    await browser.sleep(500);
    return await spinTitle(expTitle, browser, timeout - 1, pageTitle);
  }
}

async function loadWebView (desired, browser, urlToLoad, titleToSpin) {
  let app = typeof desired === 'object' ? desired.app || desired.browserName : desired;
  let uuid = uuidGenerator.v1();

  if (typeof urlToLoad === 'undefined') {
    urlToLoad = guineaEndpoint(app) + `?${uuid}`;
  }
  if (typeof titleToSpin === 'undefined') {
    titleToSpin = uuid;
  }
  if (BROWSERS.indexOf(app) > -1) {
    await browser.get(urlToLoad);
    await browser.sleep(3000);
    return await spinTitle(titleToSpin, browser);
  }

  let ctxs = await browser.contexts();
  ctxs.length.should.be.above(0);
  await browser.context(ctxs[1]);

  let url = await browser.url();
  if (url !== urlToLoad) {
    await browser.get(urlToLoad);
  }

  return await spinTitle(titleToSpin, browser);
}

async function spinWait (spinFn, waitMs = 10000, intMs = 500) {
  let begunAt = Date.now();
  let endAt = begunAt + waitMs;
  let spin = async () => {
    try {
      await spinFn();
    } catch (err) {
      if (Date.now() > endAt) {
        throw new Error(`spinWait condition unfulfilled. Promise rejected with error: ${err}`);
      }

      return setTimeout(async () => await spin(spinFn), intMs);
    }
  };
  await spin(spinFn);
}

function isChrome (desired) {
  if (typeof desired === 'string') {
    desired = { browserName: desired };
  }

  return CHROMES.indexOf(desired.app) > -1 ||
         CHROMES.indexOf(desired.browserName) > -1;
}

function skip(reason, done) {
  console.warn('skipping: ' + reason);
  return done();
}

let testEndpoint = function (desired) {
  return isChrome(desired) ? env.CHROME_TEST_END_POINT : env.TEST_END_POINT;
};

function guineaEndpoint (desired) {
  return isChrome(desired) ? env.CHROME_GUINEA_TEST_END_POINT :
                             env.GUINEA_TEST_END_POINT;
}

// TODO: investigate why we need that
let ignoreEncodingBug = function(value, desired) {
  if (isChrome(desired)) {
    console.warn('Going round android bug: whitespace in cookies.');
    return encodeURI(value);
  }

  return value;
};

export { spinTitle, loadWebView, isChrome, skip, testEndpoint, ignoreEncodingBug, spinWait };
