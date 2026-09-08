import { RequestClient } from '@segment/actions-core'
import { Settings } from '../generated-types'
import { getCategories } from '../sfmc-operations'
import { SFMC_SOAP_CATEGORY_BATCH_SIZE_FLAGON } from '../versioning-info'
import { xml2js } from 'xml-js'

jest.mock('xml-js', () => ({
  xml2js: jest.fn()
}))

const settings: Settings = {
  subdomain: 'test123',
  client_id: 'test123',
  client_secret: 'test123',
  account_id: 'test123'
}

describe('Salesforce Marketing Cloud Category List Operations', () => {
  describe('getCategoryList with ContentType filter', () => {
    it('should get categories filtered by ContentType=dataextension', async () => {
      ;(xml2js as jest.Mock).mockImplementation(() => {
        return {
          'soap:Envelope': {
            'soap:Body': {
              RetrieveResponseMsg: {
                Results: [
                  {
                    ID: {
                      _text: '123'
                    },
                    Name: {
                      _text: 'Test Category 1'
                    },
                    ContentType: {
                      _text: 'dataextension'
                    }
                  },
                  {
                    ID: {
                      _text: '456'
                    },
                    Name: {
                      _text: 'Test Category 2'
                    },
                    ContentType: {
                      _text: 'dataextension'
                    }
                  }
                ]
              }
            }
          }
        }
      })

      let soapRequestBody = ''
      const requestSpy = jest.fn().mockImplementation((url, options) => {
        if (url.includes('auth.marketingcloudapis.com/v2/token')) {
          return Promise.resolve({
            data: {
              access_token: 'mock-access-token',
              soap_instance_url: 'https://mock-instance.soap.marketingcloudapis.com'
            }
          })
        } else if (url.includes('soap.marketingcloudapis.com/Service.asmx')) {
          soapRequestBody = options?.body || ''
          return Promise.resolve({
            content: 'mock-xml-content'
          })
        }
        return Promise.resolve({ data: {} })
      }) as unknown as RequestClient

      const response = await getCategories(requestSpy, settings)

      expect(soapRequestBody).toBeDefined()
      expect(soapRequestBody).toContain('<Filter xsi:type="SimpleFilterPart">')
      expect(soapRequestBody).toContain('<Property>ContentType</Property>')
      expect(soapRequestBody).toContain('<SimpleOperator>equals</SimpleOperator>')
      expect(soapRequestBody).toContain('<Value>dataextension</Value>')

      expect(response).toBeDefined()
      expect(response.choices).toHaveLength(2)
      expect(response.choices?.[0].value).toBe('123')
      expect(response.choices?.[0].label).toBe('Test Category 1')
      expect(response.choices?.[0].description).toBe('ContentType: dataextension')
      expect(response.choices?.[1].value).toBe('456')
      expect(response.choices?.[1].label).toBe('Test Category 2')
      expect(response.choices?.[1].description).toBe('ContentType: dataextension')
    })

    it('should include BatchSize in SOAP request body when feature flag is enabled', async () => {
      ;(xml2js as jest.Mock).mockImplementation(() => {
        return {
          'soap:Envelope': {
            'soap:Body': {
              RetrieveResponseMsg: {
                Results: []
              }
            }
          }
        }
      })

      let soapRequestBody = ''
      const requestSpy = jest.fn().mockImplementation((url, options) => {
        if (url.includes('auth.marketingcloudapis.com/v2/token')) {
          return Promise.resolve({
            data: {
              access_token: 'mock-access-token',
              soap_instance_url: 'https://mock-instance.soap.marketingcloudapis.com'
            }
          })
        } else if (url.includes('soap.marketingcloudapis.com/Service.asmx')) {
          soapRequestBody = options?.body || ''
          return Promise.resolve({ content: 'mock-xml-content' })
        }
        return Promise.resolve({ data: {} })
      }) as unknown as RequestClient

      await getCategories(requestSpy, settings, { [SFMC_SOAP_CATEGORY_BATCH_SIZE_FLAGON]: true })

      expect(soapRequestBody).toContain('<BatchSize>200</BatchSize>')
    })

    it('should NOT include BatchSize in SOAP request body when feature flag is disabled', async () => {
      ;(xml2js as jest.Mock).mockImplementation(() => {
        return {
          'soap:Envelope': {
            'soap:Body': {
              RetrieveResponseMsg: {
                Results: []
              }
            }
          }
        }
      })

      let soapRequestBody = ''
      const requestSpy = jest.fn().mockImplementation((url, options) => {
        if (url.includes('auth.marketingcloudapis.com/v2/token')) {
          return Promise.resolve({
            data: {
              access_token: 'mock-access-token',
              soap_instance_url: 'https://mock-instance.soap.marketingcloudapis.com'
            }
          })
        } else if (url.includes('soap.marketingcloudapis.com/Service.asmx')) {
          soapRequestBody = options?.body || ''
          return Promise.resolve({ content: 'mock-xml-content' })
        }
        return Promise.resolve({ data: {} })
      }) as unknown as RequestClient

      await getCategories(requestSpy, settings)

      expect(soapRequestBody).not.toContain('<BatchSize>')
    })

    it('should handle error when getting categories', async () => {
      ;(xml2js as jest.Mock).mockClear()

      let soapRequestBody = ''
      const requestSpy = jest.fn().mockImplementation((url, options) => {
        if (url.includes('auth.marketingcloudapis.com/v2/token')) {
          return Promise.resolve({
            data: {
              access_token: 'mock-access-token',
              soap_instance_url: 'https://mock-instance.soap.marketingcloudapis.com'
            }
          })
        } else if (url.includes('soap.marketingcloudapis.com/Service.asmx')) {
          soapRequestBody = options?.body || ''
          throw {
            response: {
              data: {
                message: 'Error retrieving categories'
              }
            }
          }
        }
        return Promise.resolve({ data: {} })
      }) as unknown as RequestClient

      const response = await getCategories(requestSpy, settings)

      expect(soapRequestBody).toBeDefined()
      expect(soapRequestBody).toContain('<Filter xsi:type="SimpleFilterPart">')
      expect(soapRequestBody).toContain('<Property>ContentType</Property>')
      expect(soapRequestBody).toContain('<SimpleOperator>equals</SimpleOperator>')
      expect(soapRequestBody).toContain('<Value>dataextension</Value>')

      expect(response).toBeDefined()
      expect(response.choices).toHaveLength(0)
    })

    it('should handle timeout/network error where err.response is undefined', async () => {
      ;(xml2js as jest.Mock).mockClear()

      const requestSpy = jest.fn().mockImplementation((url) => {
        if (url.includes('auth.marketingcloudapis.com/v2/token')) {
          return Promise.resolve({
            data: {
              access_token: 'mock-access-token',
              soap_instance_url: 'https://mock-instance.soap.marketingcloudapis.com'
            }
          })
        } else if (url.includes('soap.marketingcloudapis.com/Service.asmx')) {
          // Simulate a timeout: error has no .response property
          throw new Error('Request timed out')
        }
        return Promise.resolve({ data: {} })
      }) as unknown as RequestClient

      const response = await getCategories(requestSpy, settings)

      expect(response.choices).toHaveLength(0)
      expect(response.error).toBeDefined()
      expect(response.error?.message).toBe('Request timed out')
      expect(response.error?.code).toBe('BAD_REQUEST')
    })
  })
})
