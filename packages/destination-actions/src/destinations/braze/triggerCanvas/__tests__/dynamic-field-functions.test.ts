import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import destination from '../../index'

const testDestination = createTestIntegration(destination)

describe('Braze triggerCanvas dynamic field functions', () => {
  const settings = {
    app_id: 'test-app-id',
    api_key: 'test-api-key',
    endpoint: 'https://rest.iad-01.braze.com'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    nock.cleanAll()
  })

  describe('canvas_id', () => {
    it('should return canvases as choices', async () => {
      const mockCanvases = [
        { id: 'canvas-1', name: 'Test Canvas 1' },
        { id: 'canvas-2', name: 'Test Canvas 2' }
      ]

      // Mock the first page of canvases
      nock('https://rest.iad-01.braze.com')
        .get('/canvas/list')
        .query({ page: '0' })
        .reply(200, { canvases: mockCanvases })

      // Mock the second page (empty) to end pagination
      nock('https://rest.iad-01.braze.com').get('/canvas/list').query({ page: '1' }).reply(200, { canvases: [] })

      const result = await testDestination.testDynamicField('triggerCanvas', 'canvas_id', { settings, payload: {} })

      expect(result).toEqual({
        choices: [
          { label: 'Test Canvas 1', value: 'canvas-1' },
          { label: 'Test Canvas 2', value: 'canvas-2' }
        ]
      })
    })

    it('should handle empty canvases list', async () => {
      // Mock empty canvases response
      nock('https://rest.iad-01.braze.com').get('/canvas/list').query({ page: '0' }).reply(200, { canvases: [] })

      const result = await testDestination.testDynamicField('triggerCanvas', 'canvas_id', { settings, payload: {} })

      expect(result).toEqual({
        choices: []
      })
    })

    it('should handle API error with error message', async () => {
      // Mock API error
      nock('https://rest.iad-01.braze.com')
        .get('/canvas/list')
        .query({ page: '0' })
        .reply(500, { message: 'Internal Server Error' })

      await expect(
        testDestination.testDynamicField('triggerCanvas', 'canvas_id', { settings, payload: {} })
      ).rejects.toThrow('Failed to fetch canvas list: Internal Server Error')
    })

    it('should handle multiple pages of canvases', async () => {
      const mockCanvasesPage1 = [
        { id: 'canvas-1', name: 'Test Canvas 1' },
        { id: 'canvas-2', name: 'Test Canvas 2' }
      ]

      const mockCanvasesPage2 = [
        { id: 'canvas-3', name: 'Test Canvas 3' },
        { id: 'canvas-4', name: 'Test Canvas 4' }
      ]

      // Mock the first page of canvases
      nock('https://rest.iad-01.braze.com')
        .get('/canvas/list')
        .query({ page: '0' })
        .reply(200, { canvases: mockCanvasesPage1 })

      // Mock the second page
      nock('https://rest.iad-01.braze.com')
        .get('/canvas/list')
        .query({ page: '1' })
        .reply(200, { canvases: mockCanvasesPage2 })

      // Mock the third page (empty) to end pagination
      nock('https://rest.iad-01.braze.com').get('/canvas/list').query({ page: '2' }).reply(200, { canvases: [] })

      const result = await testDestination.testDynamicField('triggerCanvas', 'canvas_id', { settings, payload: {} })

      expect(result).toEqual({
        choices: [
          { label: 'Test Canvas 1', value: 'canvas-1' },
          { label: 'Test Canvas 2', value: 'canvas-2' },
          { label: 'Test Canvas 3', value: 'canvas-3' },
          { label: 'Test Canvas 4', value: 'canvas-4' }
        ]
      })
    })

    it('should handle malformed response', async () => {
      // Mock malformed response without canvases array
      nock('https://rest.iad-01.braze.com')
        .get('/canvas/list')
        .query({ page: '0' })
        .reply(200, { message: 'Success but no canvases field' })

      const result = await testDestination.testDynamicField('triggerCanvas', 'canvas_id', { settings, payload: {} })

      expect(result).toEqual({
        choices: []
      })
    })

    it('should sort canvases by name', async () => {
      const mockCanvases = [
        { id: 'canvas-z', name: 'Z Canvas' },
        { id: 'canvas-a', name: 'A Canvas' },
        { id: 'canvas-m', name: 'M Canvas' }
      ]

      // Mock the first page of canvases
      nock('https://rest.iad-01.braze.com')
        .get('/canvas/list')
        .query({ page: '0' })
        .reply(200, { canvases: mockCanvases })

      // Mock the second page (empty) to end pagination
      nock('https://rest.iad-01.braze.com').get('/canvas/list').query({ page: '1' }).reply(200, { canvases: [] })

      const result = await testDestination.testDynamicField('triggerCanvas', 'canvas_id', { settings, payload: {} })

      expect(result).toEqual({
        choices: [
          { label: 'A Canvas', value: 'canvas-a' },
          { label: 'M Canvas', value: 'canvas-m' },
          { label: 'Z Canvas', value: 'canvas-z' }
        ]
      })
    })

    it('should handle missing endpoint setting', async () => {
      const settingsWithoutEndpoint = {
        app_id: 'test-app-id',
        api_key: 'test-api-key',
        endpoint: undefined as any
      }

      await expect(
        testDestination.testDynamicField('triggerCanvas', 'canvas_id', {
          settings: settingsWithoutEndpoint,
          payload: {}
        })
      ).rejects.toThrow('Braze REST API endpoint is required.')
    })
  })
})
