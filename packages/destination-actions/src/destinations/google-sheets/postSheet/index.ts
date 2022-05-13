import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

// TODO: Remove dependencies
import { google } from 'googleapis'
import A1 from '@flighter/a1-notation'

type Event = {
  __segment_id: string
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  properties: any
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Post Sheet',
  description: '',
  fields: {},
  perform: (request, data) => {
    console.log(request)
    console.log(data)

    const CONFIG = {
      spreadsheetId: '1ORcFZ73VJXzj7rruKTrbUCgtRjqvKS4qW1uwDGP8tiY'
    }

    const sheets = google.sheets({
      version: 'v4'
    })

    const getIdentifierFromEvent = (event: Event) => {
      return event.__segment_id
    }

    const getRange = (targetIndex: number, columnCount: number, startRow = 1, startColumn = 1) => {
      const targetRange = new A1(startColumn, targetIndex + startRow)
      targetRange.addX(columnCount)
      return targetRange.toString()
    }

    const getColumnValuesFromEvent = (event: Event, columns: string[]) => {
      const retVal = columns.map((col) => event.properties[col] ?? '')
      retVal.unshift(getIdentifierFromEvent(event)) // Write identifier as first columnCount
      return retVal
    }

    const event = () => {
      //const randomSeed = `${Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 8)}${Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 8)}`
      const randomSeed = ''
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
          FINANCE_ENTRY_POINT: 'Inbound High Intent'
        },
        __segment_id: `${randomSeed}0063q0000126KchAAE-Robert`
      } as Event
    }
    const events = [event()]
    const columns = ['ENTRY_POINT', 'MISSING_COLUMN', 'CLOSE_DATE']

    if (!data.auth) throw new IntegrationError('Missing OAuth information')
    const access_token = data.auth.accessToken

    sheets.spreadsheets.values
      .get({
        spreadsheetId: CONFIG.spreadsheetId,
        range: 'Sheet1!A:A', //TODO: consider offset AND record matcher location
        access_token
      })
      .then((response) => {
        const eventMap = new Map(events.map((e) => [getIdentifierFromEvent(e), e]))

        const updateBatch: { event: Event; targetIndex: number }[] = []
        if (response.data.values && response.data.values.length > 0) {
          for (let i = 1; i < response.data.values.length; i++) {
            const targetIdentifier = response.data.values[i][0]
            if (eventMap.has(targetIdentifier)) {
              updateBatch.push({ event: eventMap.get(targetIdentifier) as Event, targetIndex: i })
              eventMap.delete(targetIdentifier)
            }
          }
        }

        const appendBatch = Array.from(eventMap.values())

        if (updateBatch.length > 0) {
          sheets.spreadsheets.values
            .batchUpdate({
              spreadsheetId: CONFIG.spreadsheetId,
              access_token,
              requestBody: {
                valueInputOption: 'USER_ENTERED', // TODO: Get from input
                data: updateBatch.map(({ event, targetIndex }) => {
                  const values = getColumnValuesFromEvent(event, columns)
                  return {
                    range: getRange(targetIndex, values.length),
                    values: [values]
                  }
                })
              }
            })
            .then(() => {
              console.timeEnd('update')
            })
            .catch((error) => {
              console.log(error)
            })
        }

        if (appendBatch.length > 0) {
          sheets.spreadsheets.values
            .append(
              {
                spreadsheetId: CONFIG.spreadsheetId,
                range: 'A1', // TODO: Consider offset
                valueInputOption: 'USER_ENTERED',
                access_token,
                requestBody: {
                  values: appendBatch.map((event) => getColumnValuesFromEvent(event, columns))
                }
              },
              {
                http2: true
              }
            )
            .then(() => {
              console.log('append')
            })
            .catch((error) => {
              console.log(error)
            })
        }
      })
      .catch((error) => {
        console.log(error)
      })
  }
}

export default action
