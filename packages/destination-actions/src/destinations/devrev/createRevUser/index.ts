import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { DynamicFieldResponse } from '@segment/actions-core'
import { baseUrl, getDomain } from '../utils/constants'
import { ResponseError } from '@segment/actions-core/src/create-request-client'
import {
  AccountGet,
  AccountListResponse,
  RevOrgListResponse,
  RevUserGet,
  RevUserListResponse,
  TagsResponse
} from '../utils/types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Create Rev User',
  description:
    'Creates a RevUser, unless one already exists with the same email address. Optionally posts a comment to the RevUser and applies a tag.',
  fields: {
    email: {
      label: 'Email',
      description: "The user's email address.",
      type: 'string',
      required: true,
      default: { '@path': '$.traits.email' }
    },
    fullName: {
      label: 'Full Name',
      description: "The user's full name.",
      type: 'string',
      required: false,
      default: { '@path': '$.traits.name' }
    },
    comment: {
      label: 'Comment',
      description: 'A comment to post to the RevUser.',
      type: 'string',
      required: false
    },
    tag: {
      label: 'Tag',
      description: 'A tag to apply to created Accounts.',
      type: 'string',
      dynamic: true,
      required: false
    }
  },
  dynamicFields: {
    tag: async (request): Promise<DynamicFieldResponse> => {
      try {
        const result: TagsResponse = await request(`${baseUrl}/tags.list`, {
          method: 'get',
          skipResponseCloning: true
        })
        const choices = result.data.tags.map((tag) => {
          return { value: tag.id, label: tag.name }
        })
        return {
          choices,
          nextPage: result.data.next_cursor
        }
      } catch (err) {
        return {
          choices: [],
          nextPage: '',
          error: {
            message: (err as ResponseError).message ?? 'Unknown error',
            code: (err as ResponseError).status + '' ?? 'Unknown error'
          }
        }
      }
    }
  },
  perform: async (request, data) => {
    const user = {
      email: data.payload.email,
      full_name: data.payload.fullName
    }
    console.log(user)
    const domain = getDomain(data.settings, user.email)
    const existingUsers: RevUserListResponse = await request(`${baseUrl}/internal/rev-users.list?email="${user.email}"`)
    let revUserId, accountId, revOrgId
    if (existingUsers.data.rev_users.length == 0) {
      // No existing revusers, search for Account
      const existingAccount: AccountListResponse = await request(
        `${baseUrl}/internal/accounts.list?domains="${domain}"`
      )
      if (existingAccount.data.accounts.length == 0) {
        // Create account
        const createAccount: AccountGet = await request(`${baseUrl}/internal/accounts.create`, {
          method: 'post',
          json: {
            display_name: domain,
            domains: [domain],
            tags: [
              {
                id: data.payload.tag
              }
            ]
          }
        })
        accountId = createAccount.data.account.id
        const accountRevorgs: RevOrgListResponse = await request(
          `${baseUrl}/internal/rev-orgs.list?account=${accountId}`
        )
        const filtered = accountRevorgs.data.rev_orgs.filter((revorg) => {
          revorg.external_ref_issuer == 'devrev:platform:revorg:account'
        })
        revOrgId = filtered[0].id
        const createRevUser: RevUserGet = await request(`${baseUrl}/internal/rev-users.create`, {
          method: 'post',
          json: {
            email: user.email,
            full_name: user.full_name,
            external_ref: user.email,
            org_id: revOrgId
          }
        })
        revUserId = createRevUser.data.rev_user.id
      }
    } else if (existingUsers.data.rev_users.length == 1) {
      // One existing revuser
      revUserId = existingUsers.data.rev_users[0].id
    } else {
      // Multiple existing users, use the oldest one
      const sorted = existingUsers.data.rev_users.sort((a, b) => {
        return new Date(a.created_date).getTime() - new Date(b.created_date).getTime()
      })
      revUserId = sorted[0].id
    }
    if (data.payload.comment) {
      await request(`${baseUrl}/timeline-entries.create`, {
        method: 'post',
        json: {
          object: revUserId,
          type: 'timeline_comment',
          body_type: 'text',
          body: data.payload.comment
        }
      })
    }
  }
}

export default action
