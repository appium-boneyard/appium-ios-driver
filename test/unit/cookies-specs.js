// transpile:mocha

import cookies from '../../lib/cookies.js';
import chai from 'chai';


chai.should();
chai.expect();
let expect = chai.expect;

describe ('cookies.js', function () {
  it('should properly create a JS cookie', function () {
    let jsCookie = cookies.createJSCookie('k', 'v');
    jsCookie.should.equal('k=v');
  });

  it('should create JS cookie with options given', function () {
    let jsCookie = cookies.createJSCookie('k', 'v', {expires: 'Thu, 01 Jan 2070 3:4:7 GMT', path: '/lib'});
    jsCookie.should.equal('k=v; expires=Thu, 01 Jan 2070 3:4:7 GMT; path=/lib');
  });

  it('should create JSON cookie object with options given', function () {
    let jsCookie = cookies.createJWPCookie('k', 'k=v; expires=Thu, 01 Jan 2070 3:4:7 GMT; path=/lib');
    expect(jsCookie).to.deep.equal({name: 'k', value: 'v', expires: 'Thu, 01 Jan 2070 3:4:7 GMT', path: '/lib'});
  });

  it('should return correct value given key', function () {
    let value = cookies.getValue('k', 'k=v; expires=Thu, 01 Jan 2070 3:4:7 GMT; path=/lib');
    value.should.equal('v');
  });

  it('should parse each element of string into an object', function () {
    let value = cookies.getValue(undefined, 'k=v; expires=Thu, 01 Jan 2070 3:4:7 GMT; path=/lib');
    value.should.eql({k: 'v', expires: 'Thu, 01 Jan 2070 3:4:7 GMT', path: '/lib'});
  });

  it('should handle quoted cookie', function () {
    let value = cookies.getValue('k', 'k="v"; expires=Thu, 01 Jan 2070 3:4:7 GMT; path=/lib');
    value.should.equal('v');
  });

  it('should handle quoted cookie with internal quotes', function () {
    let value = cookies.getValue('k', 'k="v\"t\""; expires=Thu, 01 Jan 2070 3:4:7 GMT; path=/lib');
    value.should.equal('v"t"');
  });

  it('should properly decode an encoded key value pair', function () {
    let value = cookies.getValue(' c', encodeURIComponent(' c') + '=' + encodeURIComponent(' v'));
    value.should.equal(' v');
  });

  it('should return undefined for an undefined key value', function () {
    let value = cookies.getValue('someKey', 'k=v');
    expect(value).to.be.undefined;
  });

  it('should decode pluses in the cookie into spaces', function () {
    let value = cookies.getValue('c', 'c=foo+bar');
    value.should.equal('foo bar');
  });

  it('should return undefined and not throw an exception on an invalid URL encoding', function () {
    let value = cookies.getValue('bad', 'bad=foo%');
    expect(value).to.be.undefined;
  });

  it('should create empty object when it is called and there is an empty string', function () {
    cookies.createJWPCookie().should.deep.equal({});
  });

  it('should properly convert the value when a converter is supplied', function () {
    let val = cookies.getValue('c', 'c=' + 1, Number);
    val.should.equal(1);
  });

  it('should return a cookie that expires on 01 Jan 1970 when removeCookie is called', function () {
    cookies.expireCookie('c').should.include('expires=Thu, 01 Jan 1970 00:00:00 GMT');
  });
});
