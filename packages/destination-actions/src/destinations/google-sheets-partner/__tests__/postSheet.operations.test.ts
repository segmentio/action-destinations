import { ExecuteInput } from '@segment/actions-core'
import { Settings } from '../generated-types'
import { Payload } from '../postSheet/generated-types'
import PostSheet from '../postSheet/index'
import { GoogleSheets, GetResponse } from '../googleapis/index'
import { CONSTANTS } from '../constants'

jest.mock('../constants', () => ({
  CONSTANTS: {
    MAX_CELLS: 300000
  }
}))

const mockGoogleSheets = {
  get: jest.fn(),
  batchUpdate: jest.fn(),
  append: jest.fn()
}

jest.mock('../googleapis/index', () => {
  const original = jest.requireActual('../googleapis/index')
  return {
    ...original,
    GoogleSheets: jest.fn().mockImplementation(() => {
      return mockGoogleSheets
    })
  }
})

describe('Google Sheets', () => {
  describe('postSheet', () => {
    beforeEach(() => {
      mockGoogleSheets.get.mockClear()
      mockGoogleSheets.batchUpdate.mockClear()
      mockGoogleSheets.append.mockClear()
    })

    const data: Partial<ExecuteInput<Settings, Payload[]>> = {
      payload: [
        {
          record_identifier: 'record_id',
          operation_type: 'created',
          spreadsheet_id: 'spreadsheet_id',
          spreadsheet_name: 'spreadsheet_name',
          data_format: 'data_format',
          fields: { column1: 'value1', column2: 'value2' }
        }
      ]
    }

    it('should call append if the new data is not found in get response', async () => {
      const getResponse: Partial<GetResponse> = {
        values: [['unknown_id']]
      }

      mockGoogleSheets.get.mockResolvedValue({
        data: getResponse
      })

      await PostSheet.performBatch?.(jest.fn(), data as ExecuteInput<Settings, Payload[]>)

      expect(GoogleSheets).toHaveBeenCalled()
      expect(mockGoogleSheets.get).toHaveBeenCalled()
      expect(mockGoogleSheets.append).toHaveBeenCalled()
      expect(mockGoogleSheets.batchUpdate).toHaveBeenCalled() // batchUpdate always gets called to write columns
    })

    it('should call update (and not append) if the new data is found in get response', async () => {
      // Make sure the spreadsheet contains the event from the payload
      const getResponse: Partial<GetResponse> = {
        values: [[data.payload?.[0].record_identifier as string]]
      }

      mockGoogleSheets.get.mockResolvedValue({
        data: getResponse
      })

      await PostSheet.performBatch?.(jest.fn(), data as ExecuteInput<Settings, Payload[]>)

      expect(GoogleSheets).toHaveBeenCalled()
      expect(mockGoogleSheets.get).toHaveBeenCalled()
      expect(mockGoogleSheets.append).not.toHaveBeenCalled()
      expect(mockGoogleSheets.batchUpdate).toHaveBeenCalled()
    })

    it('should fail because number of cells limit is reached', async () => {
      // Make sure the spreadsheet contains the event from the payload
      CONSTANTS.MAX_CELLS = 1
      const getResponse: Partial<GetResponse> = {
        values: [['id'], ['1234'], ['12345']]
      }

      mockGoogleSheets.get.mockResolvedValue({
        data: getResponse
      })

      await expect(PostSheet.performBatch?.(jest.fn(), data as ExecuteInput<Settings, Payload[]>)).rejects.toThrowError(
        'Sheet has reached maximum limit'
      )
    })
  })
})
