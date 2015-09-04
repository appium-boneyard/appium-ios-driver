async function elOrNull(driver, using, value) {
  let els = await driver.findElements(using, value);
  return els[0];
}

async function clickBack (driver) {
  let el = await elOrNull(driver, 'name', 'Back');
  if(el && (await driver.elementDisplayed(el))) {
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

export { clickBack, clickButton, elOrNull, throwMatchableError };
