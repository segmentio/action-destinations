import http from 'http'
import { google, Auth } from 'googleapis'
import express from 'express'
import Session from 'express-session'
import fs from 'fs'

const app = express()
app.use(
  Session({
    secret: 'do-not-store-secrets-in-code',
    resave: true,
    saveUninitialized: true
  })
)

const CONFIG = {
  spreadsheetId: '1F7UhjBWxcjk0Gts2snDaa5sBn2VSneZOTZhiQTtc-9c',
  credentialsFile: 'client_secret_165061189510-oljt4tbppq7nu0cmh81sqivof5ta1vh2.apps.googleusercontent.com.json'
}
const keys = JSON.parse(fs.readFileSync(`${__dirname}/${CONFIG.credentialsFile}`, 'utf-8'))

const client = new google.auth.OAuth2(keys.web.client_id, keys.web.client_secret, keys.web.redirect_uris[0])

const scopes = ['https://www.googleapis.com/auth/spreadsheets']

app.use('/callback', function (req, res) {
  const oauth2Client = client
  const session = req.session as Express.Session
  const code = req.query.code as string
  client.getToken(code, function (err, tokens) {
    console.log('tokens : ', tokens)
    if (!err) {
      oauth2Client.setCredentials(tokens as Auth.Credentials)
      session['tokens'] = tokens
      res.send(`
                <html>
                <body>
                    <h3>Login successful!!</h3>
                    <a href="/call">Go to call page</a>
                <body>
                <html>
            `)
    } else {
      res.send(`
                <html>
                <body>
                    <h3>Login failed!!</h3>
                </body>
                </html>
            `)
    }
  })
})

app.use('/getToken', function (_, res) {
  const url = client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes
  })
  res.send(`
        <html>
        <body>
<h1>Authentication using google oAuth</h1>
        <a href=${url}>Login</a>
        </body>
        </html>
    `)
})

app.use('/call', function (req, res) {
  // TODO: If token is expired, refresh it.
  if (req.session) client.setCredentials(req.session['tokens'])
  const sheets = google.sheets({
    version: 'v4',
    auth: client
  })

  sheets.spreadsheets
    .get({
      spreadsheetId: CONFIG.spreadsheetId
    })
    .then((response) => {
      res.json(response)
      console.log(response)
    })
    .catch((error) => {
      res.json(error)
      console.log(error)
    })
})

const port = 3000
const server = http.createServer(app)
server.listen(port)
server.on('listening', function () {
  console.log(`listening to ${port}`)
})
