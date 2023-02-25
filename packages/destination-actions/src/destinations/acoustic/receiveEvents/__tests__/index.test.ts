import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

import type { Settings } from '../../generated-types' 

const testEvent = createTestEvent()
testEvent.event

const testDestination = createTestIntegration(Destination)

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

//TableMaint - getAcccessToken
//TableMaint - checkRTExist
//Utilities - getProperties
//Utilities - processProperties
//addUpdateEvents


describe('AcousticSegmentConnector.receiveEvents', () => {
  // TODO: Test your action

  describe('testaddUpdateEvents', () => {
    test('validate correct form of an addupdate xml api call ', async () => {
      nock('https://your.destination.endpoint').get('*').reply(200, {})

      // This should match your authentication.fields
      //const authData = {}
      const authData = settings

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()


    })
  })




})
