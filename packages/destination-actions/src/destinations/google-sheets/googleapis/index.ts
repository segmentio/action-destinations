import createRequestClient from '../../../../../core/src/create-request-client'
type RequestClient = ReturnType<typeof createRequestClient>

// TODO: Remove
import { google } from 'googleapis'

const get = async (request: RequestClient, { spreadSheetId, range }: { spreadSheetId: string; range: string }) => {
  // TODO: Use request instead of google to make the call

  const sheets = google.sheets({
    version: 'v4',
    auth: '' // This comes from Request
  })

  console.log(request, spreadSheetId, range)
  return sheets.spreadsheets.values.get({
    spreadsheetId: spreadSheetId,
    range: range
  })
}

// TODO: Update interface
const batchUpdate = async (request: RequestClient) => {
  console.log(request)
}

// TODO: Update interface
const append = async (request: RequestClient) => {
  console.log(request)
}

export { get, batchUpdate, append }
