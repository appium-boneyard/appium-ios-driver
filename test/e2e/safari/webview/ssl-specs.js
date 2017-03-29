import desired from './desired';
import B from 'bluebird';
import https from 'https';
import setup from '../../setup-base';
import { MOCHA_SAFARI_TIMEOUT } from '../../helpers/session';

const pem = B.promisifyAll(require('pem'));

describe('When accessing an HTTPS encrypted site in Safari', function () {
  this.timeout(MOCHA_SAFARI_TIMEOUT);

  let sslServer;

  before(async function () {
    // Create an HTTPS server with a random pem certificate
    let privateKey = await pem.createPrivateKeyAsync();
    let keys = await pem.createCertificateAsync({days:1, selfSigned: true, serviceKey: privateKey.key});
    let pemCertificate = keys.certificate;

    sslServer = https.createServer({key: keys.serviceKey, cert: pemCertificate}, function (req, res) {
      res.end('Arbitrary text');
    }).listen(9758);
    desired.customSSLCert = pemCertificate;
  });

  const driver = setup(this, desired, {noReset: true}).driver;

  after(async () => {
    if (sslServer) {
      await sslServer.close();
    }
  });

  it('should be able to access it as long the PEM certificate is provided as a capability', async () => {
    await B.delay(500);
    await driver.setUrl('https://localhost:9758');
    (await driver.getPageSource()).should.include('Arbitrary text');
  });
});
