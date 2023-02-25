import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { acousticAuth } from '../Utility/TableMaint_Utilities'
import { Settings } from '../generated-types'

const settings: Settings = {
  a_pod: "2",
  a_region: "US",
  a_client_id: "1d99f8d8-0897-4090-983a-c517cc54032e",
  a_client_secret: "124bd238-0987-40a2-b8fb-879ddd4d324",
  a_refresh_token: "rD-7E2r8BynGDaapr13oJV9BxQr20lsYGN9RPkbrtPtAS1",
  a_attrMax: 30,
  a_authAPIURL: 'https://api-campaign-US-2.goacoustic.com/oauth/token',
  a_xmlAPIURL: 'https://api-campaign-US-2.goacoustic.com/XMLAPI',
  a_deleteCode: 0,
  app_Notes: '99',
  a_traits_properties: `
  track=event.context.traits.firstName,
  track=event.context.traits.lastName,
  identify=event.traits.firstName,
  identify=event.traits.lastName
  `
}


const testDestination = createTestIntegration(Definition)
const testEvent = createTestEvent()

describe('Acoustic Segment Connector', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock(`https://api-campaign-US-2.goacoustic.com/oauth/token`).get('*').reply(200, {})


      // This should match your authentication.fields
      //const authData = {}

      const auth: acousticAuth = {
        clientId: settings.a_client_id,
        clientSecret: settings.a_client_secret,
        refreshToken: settings.a_refresh_token,
        accessToken: "",
        tableListId: ""
      }
      auth.accessToken

      const authData = settings

      testEvent.event

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
      console.log("Here..... ")
    })
  })
})
