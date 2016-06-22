import env from './env';
import B from 'bluebird';
import uuidGenerator from 'node-uuid';


const BROWSERS = ['safari'];

async function spinTitle (expTitle, browser, timeout = 90, _curTitle = undefined) {
  if (timeout <= 0) {
    throw new Error(`Title never became '${expTitle}'. Last known title was '${_curTitle}'`);
  }

  let pageTitle = await browser.title();
  if (pageTitle.indexOf(expTitle) < 0) {
    await B.delay(500);
    return await spinTitle(expTitle, browser, timeout - 1, pageTitle);
  }
}

async function loadWebView (desired, browser, urlToLoad, titleToSpin) {
  let app = typeof desired === 'object' ? desired.app || desired.browserName : desired;
  let uuid = uuidGenerator.v1();

  if (typeof urlToLoad === 'undefined') {
    urlToLoad = `${env.GUINEA_TEST_END_POINT}?${uuid}`;
  }
  if (typeof titleToSpin === 'undefined') {
    titleToSpin = uuid;
  }
  if (BROWSERS.indexOf(app) > -1) {
    await browser.setUrl(urlToLoad);
    await B.delay(3000);
    return await spinTitle(titleToSpin, browser);
  }

  let ctxs = await browser.contexts();
  ctxs.length.should.be.above(0);
  await browser.context(ctxs[1]);

  let url = await browser.url();
  if (url !== urlToLoad) {
    await browser.setUrl(urlToLoad);
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

function skip (reason, done) {
  console.warn(`skipping: ${reason}`); //eslint-disable-line no-console
  return done();
}


export { spinTitle, loadWebView, skip, spinWait };
