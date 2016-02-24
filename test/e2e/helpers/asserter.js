import chai from 'chai';
import { Asserter } from 'wd';

function tagChaiAssertionError (err) {
  err.retriable = err instanceof chai.AssertionError;
  throw err;
}

function ChaiAsserter (assertFunc) {
  return new Asserter((driver) => assertFunc(driver).catch(tagChaiAssertionError));
}

export { tagChaiAssertionError, ChaiAsserter };
