import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { settings, event, revUsersListResponse, testEventPayload, accountsListResponse, revorgsListResponse, revUsersCreateResponse, accountCreateResponse, domain, email, newerCreateDate, testUserFullName, accountId, testDescription, testRevUserOlder, testTag, testRevUserNewer } from '../../mocks'

const testDestination = createTestIntegration(Destination)

describe('Devrev.createRevUser', () => {
  const loopback = (_: any, body: any) => body
  it('makes the correct devrev api calls: existing revuser, no comment', async () => {
    nock('https://api.devrev.ai').get('/internal/rev-users.list').query({email: `"${email}"`}).reply(200, revUsersListResponse.data)
    const response = await testDestination.testAction('createRevUser', { settings, event, useDefaultMappings: true })
    expect(response.length).toBe(1)
  })

  it ('makes the correct devrev api call: existing revuser, with comment', async () => {
    nock('https://api.devrev.ai').get('/internal/rev-users.list').query({email: `"${email}"`}).reply(200, revUsersListResponse.data)
    nock('https://api.devrev.ai').post('/timeline-entries.create').reply(200, loopback)
    const mapping = {
      comment: {'@path': '$.properties.description'}
    }
    const response = await testDestination.testAction('createRevUser', { settings, event, useDefaultMappings: true, mapping })
    expect(response.length).toBe(2)
    console.log(response[1].data)
    expect(response[1].data).toEqual({
      object: testRevUserOlder.id,
      type: "timeline_comment",
      body_type: "text",
      body: testDescription
    })
  })
  it ('makes the correct devrev api calls: no revuser, existing account, no comment', async () => {
    nock('https://api.devrev.ai').get('/internal/rev-users.list').query({email: `"${email}"`}).reply(200, { rev_users: [] } )
    nock('https://api.devrev.ai').get('/internal/accounts.list').query({domains: `"${domain}"`}).reply(200, accountsListResponse.data)
    nock('https://api.devrev.ai').get('/internal/rev-orgs.list').query({account: accountId}).reply(200, revorgsListResponse.data)
    nock('https://api.devrev.ai').post('/internal/rev-users.create').reply(200, revUsersCreateResponse)
    const response = await testDestination.testAction('createRevUser', { settings, event, useDefaultMappings: true })
    expect(response.length).toBe(4)
    expect(response[3].data).toEqual({rev_user: {
      id: testRevUserNewer.id,
      created_date: newerCreateDate,
      display_name: testUserFullName,
      email: testEventPayload.properties?.email,
      rev_org: {
        id: 'newer-but-default-revo',
        display_name: 'test-org'
      }
    }})
  })
  it ('makes the correct devrev api calls: no revuser, no account, no comment', async () => {
    nock('https://api.devrev.ai').get('/internal/rev-users.list').query({email: `"${email}"`}).reply(200, { rev_users: [] } )
    nock('https://api.devrev.ai').get('/internal/accounts.list').query({domains: `"${domain}"`}).reply(200, { accounts: [] } )
    nock('https://api.devrev.ai').post('/internal/accounts.create').reply(200, accountCreateResponse)
    nock('https://api.devrev.ai').get('/internal/rev-orgs.list').query({account: accountId}).reply(200, revorgsListResponse.data)
    nock('https://api.devrev.ai').post('/internal/rev-users.create').reply(200, revUsersCreateResponse)
    const response = await testDestination.testAction('createRevUser', { settings, event, useDefaultMappings: true })
    expect(response.length).toBe(5)
    expect(response[4].data).toEqual({rev_user: {
      id: testRevUserNewer.id,
      created_date: newerCreateDate,
      display_name: testUserFullName,
      email: email,
      rev_org: {
        id: 'newer-but-default-revo',
        display_name: 'test-org'
      }
    }})
    expect(response[2].data).toEqual({account: {
      id: 'test-account-id',
      created_date: newerCreateDate,
      display_name: domain,
      external_refs: [domain],
      domains: [domain],
      state: 'active',
    }})
  })
  it('makes the correct devrev api calls: no revUser, no account, no comment, blacklisted domain', async () => {
    nock('https://api.devrev.ai').get('/internal/rev-users.list').query({email: `"${email}"`}).reply(200, { rev_users: [] } )
    nock('https://api.devrev.ai').get('/internal/accounts.list').query({external_refs: `"${email}"`}).reply(200, { accounts: [] } )
    nock('https://api.devrev.ai').post('/internal/accounts.create').reply(200, accountCreateResponse)
    nock('https://api.devrev.ai').get('/internal/rev-orgs.list').query({account: accountId}).reply(200, revorgsListResponse.data)
    nock('https://api.devrev.ai').post('/internal/rev-users.create').reply(200, revUsersCreateResponse)
    const modifiedSettings = {
      ...settings,
    }
    modifiedSettings.blacklistedDomains = 'test.com'
    const response = await testDestination.testAction('createRevUser', { settings: modifiedSettings, event, useDefaultMappings: true })
    expect(response.length).toBe(5)
    expect(response[4].data).toEqual({rev_user: {
      id: testRevUserNewer.id,
      created_date: newerCreateDate,
      display_name: testUserFullName,
      email: email,
      rev_org: {
        id: 'newer-but-default-revo',
        display_name: 'test-org'
      }
    }})
    expect(response[2].data).toEqual({account: {
      id: 'test-account-id',
      created_date: newerCreateDate,
      display_name: email,
      state: 'active',
      external_refs: [email]
    }})
  })
  it('makes the correct devrev api calls: no revUser, no account, no comment, with tag and comment', async () => {
    nock('https://api.devrev.ai').get('/internal/rev-users.list').query({email: `"${email}"`}).reply(200, { rev_users: [] } )
    nock('https://api.devrev.ai').get('/internal/accounts.list').query({domains: `"${domain}"`}).reply(200, { accounts: [] } )
    nock('https://api.devrev.ai').post('/internal/accounts.create').reply(200, accountCreateResponse)
    nock('https://api.devrev.ai').get('/internal/rev-orgs.list').query({account: accountId}).reply(200, revorgsListResponse.data)
    nock('https://api.devrev.ai').post('/internal/rev-users.create').reply(200, revUsersCreateResponse)
    nock('https://api.devrev.ai').post('/timeline-entries.create').reply(200, loopback)

    const mapping = {
      tag: testTag.id,
      comment: {'@path': '$.properties.description'}
    }
    const response = await testDestination.testAction('createRevUser', { settings, event, useDefaultMappings: true, mapping })
    expect(response.length).toBe(6)
    expect(response[4].data).toEqual({rev_user: {
      id: testRevUserNewer.id,
      created_date: newerCreateDate,
      display_name: testUserFullName,
      email: email,
      rev_org: {
        id: 'newer-but-default-revo',
        display_name: 'test-org'
      }
    }})
    expect(response[2].data).toEqual({account: {
      id: 'test-account-id',
      created_date: newerCreateDate,
      display_name: domain,
      external_refs: [domain],
      domains: [domain],
      state: 'active',
      tags: [{id: testTag.id}]
    }})
    expect(response[5].data).toEqual({
      object: testRevUserNewer.id,
      type: "timeline_comment",
      body_type: "text",
      body: testDescription
    })

  })  
})
  
