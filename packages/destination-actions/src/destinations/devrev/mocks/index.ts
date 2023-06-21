export const tagsResponse = {
  data: {
    tags: [
      {
        id: 'don:core:dvrv-us-1:devo/g0NHWj3i:tag/2',
        display_id: 'tag-2',
        name: 'test-tag',
        type: 'tag'
      }
    ]
  }
}

export const accountsListResponse = {
  data: {
    accounts: [
      {
        id: 'don:identity:dvrv-us-1:devo/g0NHWj3i:account/cDQcoK9u',
        created_date: '2023-06-02T09:17:21.714Z',
        description: 'test-newer',
        display_id: 'ACC-cDQcoK9u',
        display_name: 'test-dev',
        environment: 'production',
        external_refs: ['don:identity:dvrv-us-1:devo/g0NHWj3i:account/cDQcoK9u'],
        state: 'active'
      },
      {
        id: 'don:identity:dvrv-us-1:devo/g0NHWj3i:account/jllQLGB2',
        created_date: '2023-06-02T09:17:21.681Z',
        description: 'test-older',
        display_id: 'ACC-jllQLGB2',
        display_name: 'Demo',
        environment: 'production',
        domains: ['test.com'],
        external_refs: ['test.com'],
        state: 'active'
      }
    ]
  }
}

export const revorgsListResponse = {
  data: {}
}

export const revUsersListResponse = {
  data: {}
}

export const accountsCreateResponse = {
  data: {}
}

export const revUsersCreateResponse = {
  data: {}
}

export const testPartsResponse = {
  parts: [
    {
      type: 'product',
      id: 'don:core:dvrv-us-1:devo/g0NHWj3i:product/2',
      created_date: '2023-06-08T17:30:02.353Z',
      display_id: 'PROD-2',
      name: 'BaseProduct'
    }
  ]
}

export const testDevUserListResponse = {
  dev_users: [
    {
      id: 'don:identity:dvrv-us-1:devo/g0NHWj3i:devu/1',
      created_date: '2022-08-28T17:19:52.075Z',
      display_id: 'DEVU-1',
      display_name: 'testy-mctesty',
      email: 'test-email@test.com',
      full_name: 'Tester McTesty',
      state: 'active'
    }
  ]
}
