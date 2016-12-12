import desired from './desired';
import B from 'bluebird';
import https from 'https';
import setup from '../../setup-base';


const pem = B.promisifyAll(require('pem'));

describe('When accessing an HTTPS encrypted site in Safari', async function () {
  let sslServer;

  before(async function () {
    // TODO: investigate why this test fails in TRAVIS
    //   it seems that the simulator never gets the `Librarys/Keychains/TrustStore.sqlite3`
    //   directory that is needed to add the certificate
    if (process.env.TRAVIS) {
      this.skip();
      return;
    }
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
