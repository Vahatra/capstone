'use strict';

const loopback = require('loopback');
const boot = require('loopback-boot');
var jwt = require('express-jwt');
var jwksRsa = require('jwks-rsa');

const app = module.exports = loopback();

const authConfig = {
  domain: "dev-wmibpyzw.eu.auth0.com",
  audience: "GmNWHMeFdCdgRwGPkgquvvXqERT7yz2R"
};

const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${authConfig.domain}/.well-known/jwks.json`
  }),

  audience: authConfig.audience,
  issuer: `https://${authConfig.domain}/`,
  algorithm: ["RS256"]
});

// app.all("/api/*", checkJwt, (req, res, next) => {
//   next()
// });

// Catch error
app.use(function (err, req, res, next) {
  if (err.name === 'UnauthorizedError') {
    res.status(401).send('Invalid token, or no token supplied!');
  } else {
    res.status(401).send(err);
  }
});

app.use(function (req, res, next) {
  app.currentToken = null;
  if (req.headers.authorization) {
    app.currentToken = req.headers.authorization.split(" ")[1];
  }
  return next();
});

app.start = function () {
  // start the web server
  return app.listen(function () {
    app.emit('started');
    const baseUrl = app.get('url').replace(/\/$/, '');
    console.log('Web server listening at: %s', baseUrl);
    if (app.get('loopback-component-explorer')) {
      const explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
    }
  });
};

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function (err) {
  if (err) throw err;

  // start the server if `$ node server.js`
  if (require.main === module)
    app.start();
});
