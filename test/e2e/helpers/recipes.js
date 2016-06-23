import _ from 'lodash';
import B from 'bluebird';

async function elOrNull (driver, using, value) {
  let els = await driver.findElements(using, value);
  return els[0];
}

async function clickBack (driver) {
  let el = await elOrNull(driver, 'accessibility id', 'Back');
  if (el && (await driver.elementDisplayed(el))) {
    await driver.click(el);
  }
}

async function clickButton (driver, name) {
  let el = await elOrNull(driver, 'xpath', `//UIAButton[@name = '${name}']`);
  if (el && (await driver.elementDisplayed(el))) {
    await driver.click(el);
  }
}

function throwMatchableError (err) {
  // When using several versions of a library (i.e. mobile-json-wire-protocol),
  // instanceof doesn't work as expected, so in tests we just use jsonwpCode
  // and message to determine that the expected error was sent.
  throw new Error(`jsonwpCode: ${err.jsonwpCode} ${err.message}`);
}

async function filterDisplayed (driver, els) {
  let displayedEls = await B.all(_.map(els, function (el) { return driver.elementDisplayed(el); }));
  return _.filter(els, function (el, i) { return displayedEls[i]; });
}

function filterVisibleUiaSelector (selector) {
  return selector.replace(/;$/, '.withPredicate("isVisible == 1");');
}

async function okIfAlert (driver) {
  let text;
  try {
    text = await driver.getAlertText();
  } catch (err) {
    // if NoAlertOpenError (27) continue
    if (err.jsonwpCode !== 27) {
      throw err;
    }
  }
  if (text) {
    await driver.postAcceptAlert();
  }
}

export { clickBack, clickButton, elOrNull, throwMatchableError, filterDisplayed,
         filterVisibleUiaSelector, okIfAlert };
