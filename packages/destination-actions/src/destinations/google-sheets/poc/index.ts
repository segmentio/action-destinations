import http from 'http'
import { google, Auth } from 'googleapis'
import express from 'express'
import Session from 'express-session'
import fs from 'fs'
// import A1 from '@flighter/a1-notation'

const app = express()
app.use(
  Session({
    secret: 'do-not-store-secrets-in-code',
    resave: true,
    saveUninitialized: true
  })
)

const CONFIG = {
  spreadsheetId: '1uvyE_oEs9NG_WrL2aWG_XDcMYwPm6Q2dlppwzy73f90',
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

  const event = () => {
    const randomSeed = `${Math.random()
      .toString(36)
      .replace(/[^a-z]+/g, '')
      .substr(0, 8)}${Math.random()
      .toString(36)
      .replace(/[^a-z]+/g, '')
      .substr(0, 8)}`
    //const randomSeed = ''
    return {
      type: 'track',
      event: 'updated', // or: "new", "deleted"
      receivedAt: '2022-04-12T23:17:41.192501242Z',
      channel: 'server',
      properties: {
        CLOSE_DATE: '2022-07-08T00:00:00Z',
        CLOSE_DATE_EOQ: '2022-07-08',
        ENTRY_POINT: `${randomSeed}Website Demo Request`,
        E_ARR_POST_LAUNCH_C: '100000.0',
        FINANCE_ENTRY_POINT: 'Inbound High Intent',
        '4': '4',
        '5': '4',
        '6': '4',
        '7': '4',
        '8': '4',
        '9': '4',
        '10': '4',
        '11': '4',
        '12': '4',
        '13': '4',
        '14': '4',
        '15': '4',
        '16': '4',
        '17': '4',
        '18': '4',
        '19': '4',
        '20': '4',
        '21': '4',
        '22': '4',
        '23': '4',
        '24': '4',
        '25': '4',
        '26': '4',
        '27': '4'
      },
      __segment_id: `${randomSeed}0063q0000126KchAAE`
    }
  }

  const events = Array.from({ length: 50 }, () => event())
  const columns = [
    'ENTRY_POINT',
    'MISSING_COLUMN',
    'CLOSE_DATE',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '10',
    '11',
    '12',
    '13',
    '14',
    '15',
    '16',
    '17',
    '18',
    '19',
    '20',
    '21',
    '22',
    '23',
    '24',
    '25',
    '26',
    '27'
  ]
  //const columns = ["ENTRY_POINT", "MISSING_COLUMN", "CLOSE_DATE"]

  // TODO: Possible type bug? Repro: Commit a value with a data type to a cell, then update schema to be a different data value. New value will have data type of old value.
  // OPTIMIZATION: Merge proximal ranges across events into a single payload.

  const getIdentifierFromEvent = (event: any) => {
    return event.__segment_id
  }

  // const getRange = (targetIndex: number, columnCount: number, startRow = 1, startColumn = 1) => {
  //   const targetRange = new A1(startColumn, targetIndex + startRow)
  //   targetRange.addX(columnCount)
  //   return targetRange.toString()
  // }

  const getColumnValuesFromEvent = (event: any, columns: string[]) => {
    const retVal = columns.map((col) => event.properties[col] ?? '')
    retVal.unshift(getIdentifierFromEvent(event)) // Write identifier as first columnCount
    return retVal
  }

  console.time('e2e')
  console.time('get')
  sheets.spreadsheets.values
    .get(
      {
        spreadsheetId: CONFIG.spreadsheetId,
        range: 'Sheet1!A:A' //TODO: consider offset AND record matcher location
      },
      {
        http2: true
      }
    )
    .then((response) => {
      console.timeEnd('get') // TODO: need paging?

      console.time('getPreProcessing')
      const eventMap = new Map(events.map((e) => [getIdentifierFromEvent(e), e]))
      console.timeEnd('getPreProcessing')

      console.time('getProcessing')
      const updateBatch: any[] = []
      if (response.data.values && response.data.values.length > 0) {
        for (let i = 1; i < response.data.values.length; i++) {
          const targetIdentifier = response.data.values[i][0]
          if (eventMap.has(targetIdentifier)) {
            updateBatch.push({ event: eventMap.get(targetIdentifier), targetIndex: i })
            eventMap.delete(targetIdentifier)
          }
        }
      }

      const appendBatch = Array.from(eventMap.values())
      console.timeEnd('getProcessing')

      const promises = []
      // if (updateBatch.length > 0) {
      //   console.time('update')
      //   promises.push(
      //     sheets.spreadsheets.values
      //       .batchUpdate({
      //         spreadsheetId: CONFIG.spreadsheetId,
      //         requestBody: {
      //           valueInputOption: 'USER_ENTERED', // TODO: Get from input
      //           data: updateBatch.map(({ event, targetIndex }) => {
      //             const values = getColumnValuesFromEvent(event, columns)
      //             return {
      //               range: getRange(targetIndex, values.length),
      //               values: [values]
      //             }
      //           })
      //         }
      //       })
      //       .then(() => {
      //         console.timeEnd('update')
      //       })
      //       .catch((error) => {
      //         res.json(error)
      //         console.log(error)
      //       })
      //   )
      // }

      if (appendBatch.length > 0) {
        //console.time('append')

        const promise = appendBatch.map((event) => {
          return sheets.spreadsheets.values
            .append({
              spreadsheetId: CONFIG.spreadsheetId,
              range: 'A1',
              valueInputOption: 'USER_ENTERED',
              requestBody: {
                values: [getColumnValuesFromEvent(event, columns)]
              }
            })
            .catch((error) => {
              res.json(error)
              console.log(error)
            })
        })
        promises.push(...promise)

        // const promise = sheets.spreadsheets.values.append({
        //   spreadsheetId: CONFIG.spreadsheetId,
        //   range: 'A1', // TODO: Consider offset
        //   valueInputOption: 'USER_ENTERED',
        //   requestBody: {
        //     values: appendBatch.map((event) => getColumnValuesFromEvent(event, columns))
        //   }
        // })
        // promises.push(promise)
      }

      Promise.all(promises)
        .then(() => {
          console.timeEnd('e2e')
          res.status(200).end()
          // console.log(response)
        })
        .catch(() => {
          console.timeEnd('e2e')
          res.status(400).end()
          // console.log(response)
        })
    })
    .catch((error) => {
      res.json(error)
      console.log(error)
    })
})

// Delete
const port = 3000
const server = http.createServer(app)
server.listen(port)
server.on('listening', function () {
  console.log(`listening to ${port}`)
})
