import log from './logger';
import { server as baseServer, routeConfiguringFunction } from 'appium-base-driver';
import { IosDriver } from './driver';
import https from 'https';
import B from 'bluebird';
import request from 'request-promise';
import url from 'url';
import portfinder from 'portfinder';
const pem = B.promisifyAll(require('pem'));


async function startServer (port, host) {
  let driver = new IosDriver();
  let router = routeConfiguringFunction(driver);
  let server = baseServer(router, port, host);
  log.info(`IosDriver server listening on http://${host}:${port}`);
  return server;
}

async function startHttpsServer (port, host) {
  // Create a random pem certificate
  let privateKey = await pem.createPrivateKeyAsync();
  let keys = await pem.createCertificateAsync({days:1, selfSigned: true, serviceKey: privateKey.key});
  let pemCertificate = keys.certificate;

  // find a port
  let httpsPort = await portfinder.getPortPromise();

  // Host an SSL server that uses that certificate
  const serverOpts = {key: keys.serviceKey, cert: pemCertificate};
  let sslServer = https.createServer(serverOpts, async function (req, res) {
    log.debug(`Received HTTPS '${req.method}' request for '${req.url}'`);
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.writeHead(200);
      res.end();
    } else if (req.method === 'POST') {
      let body = '';
      req.on('data', function (data) {
        body += data;
      });
      req.on('end', async function () {
        let httpsUrl = url.parse(req.url);
        let uri = `http://${host}:${port}${httpsUrl.pathname}`;
        log.debug(`Passing '${body}' to '${uri}'`);

        // now we send to the right place
        let options = {
          method: 'POST',
          uri,
          body,
        };
        await request(options);
        res.writeHead(200);
        res.end();
      });
    }
  }).listen(httpsPort);

  return {
    sslServer,
    pemCertificate,
    httpsPort,
  };
}

export { startServer, startHttpsServer };
