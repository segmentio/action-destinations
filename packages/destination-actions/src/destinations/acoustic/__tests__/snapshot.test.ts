import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../lib/test-data'
import destination from '../index'
import nock from 'nock'

const testDestination = createTestIntegration(destination)
const destinationSlug = 'actions-acoustic-campaign'

describe(`Testing snapshot for ${destinationSlug} destination:`, () => {
  for (const actionSlug in destination.actions) {
    //Required Fields
    it(`${actionSlug} action - required fields`, async () => {
      const seedName = `${destinationSlug}#${actionSlug}`
      const action = destination.actions[actionSlug]
      const [eventData, settingsData] = generateTestData(seedName, destination, action, true)

      nock(/.*/)
        .persist()
        .post(/^\/oauth\/token/)
        .reply(
          200,
          `{
            accessToken: "fake_accessToken",
            refreshToken: "fake_refreshToken",
          }`
        )

      nock(/.*/)
        .persist()
        .post(/^\/XMLAPI/)
        .reply(
          200,
          `<Envelope>
            <Body>
                <RESULT>
                    <SUCCESS>TRUE</SUCCESS>
                        <ID>12663209</ID>
                        <NAME>Segment Events Table</NAME>
                        <TYPE>15</TYPE>
                        <SIZE>727</SIZE>
                        <NUM_OPT_OUTS>0</NUM_OPT_OUTS>
                        <NUM_UNDELIVERABLE>0</NUM_UNDELIVERABLE>
                        <LAST_MODIFIED>04/18/23 09:14 AM</LAST_MODIFIED>
                        <VISIBILITY>1</VISIBILITY>
                        <PARENT_NAME/>
                        <USER_ID>3d330984-17e415631f9-df4cba773885eb54dfcebd294a039c37</USER_ID>
                        <PARENT_FOLDER_ID>11823148</PARENT_FOLDER_ID>
                        <IS_FOLDER>false</IS_FOLDER>
                        <FLAGGED_FOR_BACKUP>false</FLAGGED_FOR_BACKUP>
                        <SUPPRESSION_LIST_ID>0</SUPPRESSION_LIST_ID>
                        <IS_DATABASE_TEMPLATE>false</IS_DATABASE_TEMPLATE>
                    </LIST>
                </RESULT>
            </Body>
        </Envelope>`
        )

      const event = createTestEvent({
        properties: eventData
      })

      const responses = await testDestination.testAction(actionSlug, {
        event: event,
        mapping: event.properties,
        settings: {
          ...settingsData,

          clientId: 'fake_client_id',
          clientSecret: 'fake_client_secret',
          refreshToken: 'fake_refresh_token',
          attributesMax: undefined,
          region: 'us',
          pod: '2'
        },
        auth: {
          accessToken: 'fake_accessToken',
          refreshToken: 'fake_refreshToken'
        }
      })

      const request = responses[0].request
      const rawBody = await request.text()

      try {
        const json = JSON.parse(rawBody)
        expect(json).toMatchSnapshot()
        return
      } catch (err) {
        expect(rawBody).toMatchSnapshot()
      }

      expect(request.headers).toMatchSnapshot()
    })

    //All Fields
    it(`${actionSlug} action - all fields`, async () => {
      const seedName = `${destinationSlug}#${actionSlug}`
      const action = destination.actions[actionSlug]
      const [eventData, settingsData] = generateTestData(seedName, destination, action, false)

      nock(/.*/)
        .persist()
        .post(/^\/oauth\/token/)
        .reply(
          200,
          `{
            accessToken: "fake_accessToken",
            refreshToken: "fake_refreshToken",
          }`
        )

      nock(/.*/)
        .persist()
        .post(/^\/XMLAPI/)
        .reply(
          200,
          `<Envelope>
              <Body>
                  <RESULT>
                      <SUCCESS>TRUE</SUCCESS>
                          <ID>12663209</ID>
                          <NAME>Segment Events Table</NAME>
                          <TYPE>15</TYPE>
                          <SIZE>727</SIZE>
                          <NUM_OPT_OUTS>0</NUM_OPT_OUTS>
                          <NUM_UNDELIVERABLE>0</NUM_UNDELIVERABLE>
                          <LAST_MODIFIED>04/18/23 09:14 AM</LAST_MODIFIED>
                          <VISIBILITY>1</VISIBILITY>
                          <PARENT_NAME/>
                          <USER_ID>3d330984-17e415631f9-df4cba773885eb54dfcebd294a039c37</USER_ID>
                          <PARENT_FOLDER_ID>11823148</PARENT_FOLDER_ID>
                          <IS_FOLDER>false</IS_FOLDER>
                          <FLAGGED_FOR_BACKUP>false</FLAGGED_FOR_BACKUP>
                          <SUPPRESSION_LIST_ID>0</SUPPRESSION_LIST_ID>
                          <IS_DATABASE_TEMPLATE>false</IS_DATABASE_TEMPLATE>
                      </LIST>
          
                  </RESULT>
              </Body>
          </Envelope>`
        )

      const event = createTestEvent({
        properties: eventData
      })

      const responses = await testDestination.testAction(actionSlug, {
        event: event,
        mapping: event.properties,
        settings: {
          ...settingsData,
          events_table_list_id: '',
          clientId: 'fake_client_id',
          clientSecret: 'fake_client_secret',
          refreshToken: 'fake_refresh_token',
          attributesMax: 30,
          region: 'us',
          pod: '2'
        },
        auth: {
          accessToken: 'fake_accessToken',
          refreshToken: 'fake_refreshToken'
        }
      })

      const request = responses[0].request
      const rawBody = await request.text()

      try {
        const json = JSON.parse(rawBody)
        expect(json).toMatchSnapshot({
          timestamp: expect.any(String)
        })
        return
      } catch (err) {
        expect(rawBody).toMatchSnapshot()
      }
    })
  }
})
