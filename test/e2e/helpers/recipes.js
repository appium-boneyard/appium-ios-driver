
async function clickBack (driver) {
  let backEl = await driver.findElements('name',  'Back');
  backEl = backEl[0];
  if(backEl && await driver.elementDisplayed(backEl)) {
    await driver.click(backEl);
  }
}

export { clickBack };


