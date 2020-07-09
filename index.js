
const url = require('url');
require('dotenv').config();
const express = require('express');
let { Issuer, generators } = require('openid-client');

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

const code_verifier = generators.codeVerifier();
const code_challenge = generators.codeChallenge(code_verifier);

const app = express();
app.set('view engine', 'pug');


(async () => {
    let issuer = await Issuer.discover('https://idp.bexio.com');

    client = new issuer.Client({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uris: ['http://localhost:3000/bexio-redirect'],
        post_logout_redirect_uris: ['http://localhost:3000/logout/callback'],
        token_endpoint_auth_method: 'client_secret_post'
    });
})();


app.get('/', function (req, res) {
    let url = client.authorizationUrl({
        scope: 'openid email profile',
        resource: 'https://idp.bexio.com/authorize',
        code_challenge,
        code_challenge_method: 'S256',
    });

    res.redirect(url);
});

app.get('/bexio-redirect', async (req, res) => {
    const params = client.callbackParams(req);

    let tokenSet = await client.callback('http://localhost:3000/bexio-redirect', params, { code_verifier });

    console.log('received and validated tokens %j', tokenSet);
    console.log('validated ID Token claims %j', tokenSet.claims());

    let userinfo = await client.userinfo(tokenSet.access_token);

    res.render('index', { accesstoken: tokenSet.access_token, sub: userinfo.sub, given_name: userinfo.given_name, family_name: userinfo.family_name, locale: userinfo.locale, email: userinfo.email });
});


app.listen(3000, function () {
    console.log('Bexio Marketplace App listening on port 3000!');
});