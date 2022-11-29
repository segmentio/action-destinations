import nock from 'nock'
import { GoogleSheets } from '../googleapis/index'

describe(`Google Sheets`, () => {
  describe(`Testing snapshots for googleapis library:`, () => {
    nock(/.*/).persist().get(/.*/).reply(200)
    nock(/.*/).persist().post(/.*/).reply(200)
    nock(/.*/).persist().put(/.*/).reply(200)

    const mappingSettings = {
      spreadsheetId: 'myId',
      spreadsheetName: 'myName',
      dataFormat: 'myFormat',
      columns: ['myColumn1', 'myColumn2']
    }

    const req = jest.fn()
    const gs = new GoogleSheets(req)
    afterEach(() => {
      req.mockClear()
    })

    it('get', async () => {
      await gs.get(mappingSettings, 'A:A')

      expect(req.mock.calls[0]).toMatchSnapshot()
    })

    it('append', async () => {
      await gs.append(mappingSettings, 'B:B', [['col1b', 'col2b']])

      expect(req.mock.calls[0]).toMatchSnapshot()
    })

    it('batchUpdate', async () => {
      await gs.batchUpdate(mappingSettings, [
        { range: 'C:C', values: [['col1c', 'col2c']] },
        { range: 'D:D', values: [['col1d, col2d']] }
      ])

      expect(req.mock.calls[0]).toMatchSnapshot()
    })
  })
})
