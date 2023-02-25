import type { RequestClient } from '@segment/actions-core'
import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { Payload } from './generated-types'
import { IntegrationError } from '@segment/actions-core'
<<<<<<< HEAD
import { acousticAuth, getxmlAPIUrl, preChecksAndMaint } from '../Utility/TableMaint_Utilities'
import { parseSections } from '../Utility/EventProcessing'
import get from 'lodash/get'

//import { writeFileSync } from 'fs' // for debugging locally only

/*
As for the audience payloads, this can come in two forms: 
As a track event
As an identify event
Here is what those payloads will look like: 
https://segment.com/docs/engage/using-engage-data/#audience-generated-events 
Essentially the Segment user has the ability to choose whether data gets sent downstream as 
a track or identify once building the audience. So I would recommend providing the ability to 
interpret both versions of this data

Event Destinations
Event Destinations and Computed traits  - Computed traits can only be sent to Event destinations. 
  When Engage sends a computed trait to an Event destination, it uses an identify call to send 
  user traits, or a group call to send account-level computed traits.

Event Destinations and Audiences
identify call  - as a user trait. When you use identify calls, the trait name is the 
  snake_cased version of the audience name you provided, and the value is "true" if the 
  user is part of the audience. For example, when a user first completes an order in the 
  last 30 days, Segment sends an identify call with the property order_completed_last_30 days: true, 
  and when this user no longer satisfies that criteria (for example if 30 days elapses and they haven't 
    completed another order), Segment sets that value to false.
track call  - as two events: Audience Entered and Audience Exited, with the event property 
  order_completed_last_30days equal to true and false, respectively.

Segment sends an identify or track call for every user in the audience when the audience is 
  first created. Later syncs only send updates for those users who were added or removed from 
  the audience since the last sync.

What do the payloads look like for Engage data?
The payloads sent from your Engage space to your destinations will be different depending on 
  if you configured the destination to receive identify or track calls, and whether the payload 
  is coming from a computed trait or audience. As a reminder, identify calls usually update a 
  trait on a user profile or table, whereas track calls send a point-in-time event that can be 
  used as a campaign trigger or a detailed record of when a user's audience membership or computed
   trait value was calculated.

Track events generated by a computed trait have a key for the trait name, and a key for the computed trait 
      value. The default event name is Trait Computed, but you can change it.
*/

console.log('In ReceiveEvents:')
process.env.NODE_DEBUG = 'https'

/*
Computed Traits
Track events generated by a computed trait have a key for the trait name, and a key for the computed trait 
      value. The default event name is Trait Computed, but you can change it.

Track Event: Audience Entered/Audience Exited - Properties: Audience_Key - true

*/

export const addUpdateEvents = async (
  request: RequestClient,
  payload: Payload,
  settings: Settings,
  email: string,
  auth: acousticAuth
): Promise<Response> => {
  //capture some events for testing offline - only when debugging locally
  // try {
  //   writeFileSync(`SegmentEventsLog_${new Date().toISOString()}.txt`, JSON.stringify(payload), {
  //     flag: 'w',
  //   });
  // }
  // catch (e) {
  //   console.log(e)
  // }

  // console.log("\nIn addUpdateEvents - Payload: " +
  //   "\nEvent Type:  " + payload.type +
  //   "\nEmail:       " + payload.email +
  //   "\nTimestamp:   " + getProperties(payload, "timestamp") +
  //   "\n")

  let eventName = ''
  let eventValue = ''
  let xmlRows = ''

  //Event Source
  const eventSource = get(payload, 'type', 'Null') + ' Event'

  //Timestamp
  // const t = `"timestamp": "2023-02-07T02:19:23.469Z"`
  const timestamp = get(payload, 'timestamp', 'Null')

  //Audience
  if (get(payload, 'context.personas.computation_class', 'Null') === 'audience') {
    const ak = get(payload, 'context.personas.computation_key', 'Null')

    //const av = `traits.${ak}`
    const av = `properties.${ak}`

    //const audiStatus = getProperties(payload, av)
    const audiStatus = get(payload, av, 'Null')
    if (audiStatus) eventValue = 'Audience Entered'
    if (!audiStatus) eventValue = 'Audience Exited'
    eventName = ak

    xmlRows += `  
      <ROW>
      <COLUMN name="EMAIL">           <![CDATA[${email}]]></COLUMN>
      <COLUMN name="EventSource">     <![CDATA[${eventSource}]]></COLUMN>  
      <COLUMN name="EventName">       <![CDATA[${eventName}]]></COLUMN>
      <COLUMN name="EventValue">      <![CDATA[${eventValue}]]></COLUMN>
      <COLUMN name="Event Timestamp"> <![CDATA[${timestamp}]]></COLUMN>
      </ROW>`
  }

  let propertiesTraitsKV: { [key: string]: string } = {}

  //parse each section to extract each attribute and value
  if (payload.traits)
    propertiesTraitsKV = {
      ...propertiesTraitsKV,
      ...parseSections(payload.traits as { [key: string]: string }, propertiesTraitsKV)
    }
  if (payload.properties)
    propertiesTraitsKV = {
      ...propertiesTraitsKV,
      ...parseSections(payload.properties as { [key: string]: string }, propertiesTraitsKV)
    }
  if (payload.context)
    propertiesTraitsKV = {
      ...propertiesTraitsKV,
      ...parseSections(payload.context as { [key: string]: string }, propertiesTraitsKV)
    }

  //Properties and Traits
  for (const e in propertiesTraitsKV) {
    const eventName = e
    const eventValue = propertiesTraitsKV[e]

    console.log(`Processed: ${eventName} : ${eventValue}`)

    xmlRows += `
     <ROW>
     <COLUMN name="Email">           <![CDATA[${email}]]></COLUMN>
     <COLUMN name="EventSource">     <![CDATA[${eventSource}]]></COLUMN>  
     <COLUMN name="EventName">       <![CDATA[${eventName}]]></COLUMN>
     <COLUMN name="EventValue">      <![CDATA[${eventValue}]]></COLUMN>
     <COLUMN name="Event Timestamp"> <![CDATA[${timestamp}]]></COLUMN>
     </ROW>`
  }

  //now post to acoustic as DB update
  return await request(getxmlAPIUrl(settings), {
    method: 'POST',
    headers: {
      'Accept-Encoding': 'gzip, deflate, br',
      Accept: '*/*',
      'Content-Type': 'text/xml',
      authorization: `Bearer ${auth.accessToken} `,
      Connection: 'keep-alive'
    },
    body: `<Envelope>
      <Body>
        <InsertUpdateRelationalTable>
        <TABLE_ID>${auth.tableListId} </TABLE_ID>
          <ROWS>
                    ${xmlRows}
          </ROWS>
        </InsertUpdateRelationalTable>
      </Body>
    </Envelope>`
  })
}
=======
//import { acousticAuth, checkRTExist, createEventsTable, deleteRTs, getAccessToken, purgeSegmentEventTable, getxmlAPIUrl } from '../Utility/TableMaint_Utilities'
import { getProperties, parseSections } from '../Utility/EventProcessing'
>>>>>>> aec59bef485677c607582f67b54a7958578b41a9

const action: ActionDefinition<Settings, Payload> = {
  title: 'Receive Track and Identify Events',
  description: 'Provide Segment Track and Identify Event Data to Acoustic Campaign',
  //defaultSubscription: 'context.personas.computation_class" =  "audience" or "context.personas.computation_class" =  "computed trait"',
  //   Does context.personas.computation_class = "computed trait"
  //defaultSubscription: 'event = "Audience Entered" or event = "Audience Exited"',
  // defaultSubscription: 'context.personas.computation_key = "audience" or context.personas.computation_key = "trait"',
  //Only accept track or identify with context.personas.computaiton_key = audience or trait -else- throw error to inform

  fields: {
    // event: {
    //   label: 'Event',
    //   description: "Event Body",
    //   type: 'object',
    //   default: {
    //     '@path': '$event'
    //   }
    // },
    email: {
      label: 'Email',
      description: 'Email Field',
      type: 'string',
      format: 'email',
<<<<<<< HEAD
      required: true,
=======
      require: true,
>>>>>>> aec59bef485677c607582f67b54a7958578b41a9
      default: {
        '@if': {
          exists: { '@path': '$.context.traits.email' },
          then: { '@path': '$.context.traits.email' },
          else: { '@path': '$.traits.email' }
        }
      }
    },
    type: {
      label: 'Type',
      description: 'Event Type',
      type: 'string',
      default: {
        '@path': '$.type'
      }
    },
    timestamp: {
      label: 'Timestamp',
      description: 'Timestamp',
      type: 'datetime',
      default: {
        '@path': '$.timestamp'
      }
    },
    context: {
      label: 'Context',
      description: 'Context Section',
      type: 'object',
      default: {
        '@path': '$.context'
      }
    },
    properties: {
      label: 'Properties',
      description: 'Properties Section',
      type: 'object',
      default: {
        '@path': '$.properties'
      }
    },
    traits: {
      label: 'Traits',
      description: 'Traits Section',
      type: 'object',
      default: {
        '@path': '$.traits'
      }
    },

    enable_batching: {
      label: 'Enable Batching',
      description: 'Enable batching of Segment Events through to Acoustic Tables',
      type: 'boolean',
      default: true
    }
  },

<<<<<<< HEAD
  /*
  The `perform` method accepts two arguments, 
  (1) the request client instance (extended with your destination's `extendRequest`, and 
  (2) the data bundle. The data bundle includes the following fields:
  - `payload` - The transformed input data, based on `mapping` + `event` (or `events` if batched). You'll get compile-time type-safety for how you access anything in the `data.payload`.
  - `settings` - The global destination settings.
  - `auth` - The data needed in OAuth requests. This is useful if fetching an updated OAuth `access_token` using a `refresh_token`. The `refresh_token` is available in `auth.refreshToken`.
 
  // - `features` - The features available in the request based on the customer's sourceID. Features can only be enabled and/or used by internal Twilio/Segment employees. Features cannot be used for Partner builds.
  // - `statsContext` - An object, containing a `statsClient` and `tags`. Stats can only be used by internal Twilio/Segment employees. Stats cannot be used for Partner builds.
  // - `logger` - Logger can only be used by internal Twilio/Segment employees. Logger cannot be used for Partner builds.
  // - `transactionContext` - An object, containing transaction variables and a method to update transaction variables which are required for few segment developed actions. Transaction Context cannot be used for Partner builds.
  // - `stateContext` - An object, containing context variables and a method to get and set context variables which are required for few segment developed actions. State Context cannot be used for Partner builds.
 
      // `perform` takes two arguments:
      // 1. the request client instance (extended with your destination's `extendRequest`
      // 2. the data bundle (destructured below)
      perform: (request, { payload, settings, auth, features, statsContext }) => {
        return request('https://example.com', {
          headers: { Authorization: `Bearer ${data.settings.api_key}` },
          json: data.payload
        })
      }
  */

  perform: async (request, { payload, settings }) => {
    console.log('In Perform Action --> ')

    //Do not proceed if nothing we can work with,
    if (Object.entries(payload).length < 1)
      throw new IntegrationError(`Empty Payload - Cannot process ->  ${Object.keys(payload)}   <- `)

    let email = get(payload, 'context.traits.email', 'Null')
    if (email == undefined) email = get(payload, 'traits.email', 'Null')
    if (email == undefined)
      throw new IntegrationError('Email not provided, cannot process Audience Events without included Email')
=======
  perform: async (request, { payload, settings }) => {
    console.log("In Perform Action --> ")

    // //Get a line-out of the object
    // //Object Keys: messageId,timestamp,type,email,properties,userId,event,anonymousId,context,receivedAt,sentAt,version
    // console.log(`Keep an eye on the object --> 
    //   \nObject Keys:    ${Object.keys(payload)}
    //   \nObject Values:  ${Object.values(payload)}
    //   \nObject Entries: ${Object.entries(payload)}\n`)

    const auth: acousticAuth = {
      clientId: settings.a_client_id,
      clientSecret: settings.a_client_secret,
      refreshToken: settings.a_refresh_token,
      accessToken: "",
      tableListId: ""
    }

    // //Only needed when curl testing
    // if (Object.entries(payload).length < 1) throw new IntegrationError(`Empty Payload - Cannot process ->  ${Object.keys(payload)}   <- `)

    let email = get(payload, "context.traits.email")
    if (email == undefined) email = get(payload, "traits.email")
    if (email == undefined) throw new IntegrationError("Email not provided, cannot process Audience Events without included Email")
>>>>>>> aec59bef485677c607582f67b54a7958578b41a9

    const auth: acousticAuth = await preChecksAndMaint(request, payload, settings)

<<<<<<< HEAD
    //Ok, email, prechecks and Maint are all accomplished, let's see what needs to be processed,
=======
    //First reach out to the Acoustic environment to confirm connectivity and 
    //    might as well get an OAuth2 while we're at it
    if (!auth.accessToken) {
      const at = await getAccessToken(request, settings, auth)
      auth.accessToken = parseResponse(at)
    }
    if (!auth.accessToken) throw new IntegrationError("Could not acquire an Access Token, check configuration parameters are correct and credentials have not expired. ")


    //Long-term Maintenacne
    //For Support to easily reset a Customers Acoustic "Segment Events Table"
    if (!settings.a_deleteCode) settings.a_deleteCode = 0
    if (settings.a_deleteCode > 99999 && settings.a_deleteCode < 100000) {
      const _dtabs = await deleteRTs(request, settings, auth)
      _dtabs.length
    }
    //For testing: uncomment to delete the Audiences Table
    //const dtabs = await deleteRTs(request, settings, auth)


    //For long-term Maintenance - check each month to delete data older than 1 years 
    const checkPurge = new Date()
    if (checkPurge.getDate() == 1 &&    //First of the Month
      checkPurge.getHours() == 12 &&    //At Noon 
      checkPurge.getMinutes() == 30 &&  //At half-past Noon
      checkPurge.getSeconds() > 50) {   //to almost 31 past Noon 

      const purgeDate = new Date()
      purgeDate.setFullYear(purgeDate.getFullYear() - 1);
      await purgeSegmentEventTable(request, settings, auth, purgeDate)
    }
    //Worst case we're calling checkPurge for a full 10 seconds repeatedly or missing the time 
    //  altogether but we'll get it next month - long-term we're still in good shape
    //For Testing - 
    // await purgeOldAudience(request, settings, auth, "02/11/2023 11:20:00")


    //check for table, if not exist create it  
    //if (!auth.tableListId || auth.tableListId === "") {
    //Pull the list and parse it to see if Audience Table is on it, 
    const chkExist = await checkRTExist(request, settings, auth)
    if (!chkExist) {
      console.log("Acoustic Audiences Table did not exist, creating new ....")
      const crt = await createEventsTable(request, settings, auth)
      if (!crt) {
        console.log("Error attempting to create an Acoustic Audiences Table")
        throw new IntegrationError("Error attempting to create an Acoustic Audiences Table")
      }
    }

    //Ok, prechecks and Maint are all attended to, let's see what needs to be processed, 
>>>>>>> aec59bef485677c607582f67b54a7958578b41a9
    return await addUpdateEvents(request, payload, settings, email, auth)
  },

  performBatch: async (request, { payload, settings }) => {
    console.log('In Perform Batch Action -> ')

    const auth: acousticAuth = await preChecksAndMaint(request, payload[0], settings)

    //Ok, prechecks and Maint are all attended to, let's see what needs to be processed,
    let i = 0
    for (const e of payload) {
      i++

<<<<<<< HEAD
      let email = get(e, 'context.traits.email', 'Null')
      if (email == undefined) email = get(e, 'traits.email', 'Null')
      if (email == undefined)
        throw new IntegrationError('Email not provided, cannot process Audience Events without included Email')
=======
      //Do not proceed if nothing we can work with,
      let email = get(e, "event.context.traits.email")
      if (email == undefined) email = get(e, "event.traits.email")
      if (email == undefined) throw new IntegrationError("Email not provided, cannot process Events without Email")
>>>>>>> aec59bef485677c607582f67b54a7958578b41a9

      return await addUpdateEvents(request, e, settings, email, auth)
    }
    return i
  }
}

export default action
