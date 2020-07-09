
const url = require('url');
require('dotenv').config();
const express = require('express');
let { Issuer, generators } = require('openid-client');

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

const code_verifier = generators.codeVerifier();
const code_challenge = generators.codeChallenge(code_verifier);
let client = null;

const app = express();
app.set('view engine', 'pug');

Issuer.discover('https://idp.bexio.com').then(iss => {
    client = new iss.Client({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uris: ['http://localhost:3000/bexio-redirect'],
        post_logout_redirect_uris: ['http://localhost:3000/logout/callback'],
        token_endpoint_auth_method: 'client_secret_post'
    });
});

app.get('/', function (req, res) {
    let url = client.authorizationUrl({
        scope: 'openid email profile',
        resource: 'https://idp.bexio.com/authorize',
        code_challenge,
        code_challenge_method: 'S256',
    });

    res.redirect(url);
});

app.get('/bexio-redirect', function (req, res) {
    const params = client.callbackParams(req);
    client.callback('http://localhost:3000/bexio-redirect', params, { code_verifier })
        .then(function (tokenSet) {
            console.log('received and validated tokens %j', tokenSet);
            console.log('validated ID Token claims %j', tokenSet.claims());
            res.render('index', { title: 'Hey', accesstoken: tokenSet.access_token });
        });
});


app.listen(3000, function () {
    console.log('Bexio Marketplace App listening on port 3000!');
});