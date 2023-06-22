import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { DynamicFieldResponse } from '@segment/actions-core'
import {
  AccountGet,
  AccountListResponse,
  RevOrgListResponse,
  RevUserGet,
  RevUserListResponse,
  TagsResponse,
  getDomain,
  devrevApiPaths,
  CreateAccountBody,
} from '../utils'
import { APIError } from '@segment/actions-core'

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
      default: { '@path': '$.properties.email' }
    },
    fullName: {
      label: 'Full Name',
      description: "The user's full name.",
      type: 'string',
      required: false,
      default: { '@path': '$.properties.name' }
    },
    comment: {
      label: 'Comment',
      description: 'A comment to post to the RevUser.  If blank, no comment will be posted on the RevUser.  This will be posted both if the RevUser is created and if the RevUser is not created',
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
    tag: async (request, { settings }): Promise<DynamicFieldResponse> => {
      try {
        const result: TagsResponse = await request(`${settings.devrevApiEndpoint}${devrevApiPaths.tagsList}`, {
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
            message: (err as APIError).message ?? 'Unknown error',
            code: (err as APIError).status + '' ?? 'Unknown error'
          }
        }
      }
    }
  },
  perform: async (request, { settings, payload }) => {
    const domain = getDomain(settings, payload.email)
    const existingUsers: RevUserListResponse = await request(
      `${settings.devrevApiEndpoint}${devrevApiPaths.revUsersList}?email="${payload.email}"`
    )
    let revUserId, accountId, revOrgId
    if (existingUsers.data.rev_users.length == 0) {
      // No existing revusers, search for Account
      let requestUrl;
      if (domain !== payload.email)
        requestUrl = `${settings.devrevApiEndpoint}${devrevApiPaths.accountsList}?domains="${domain}"`
      else
        requestUrl = `${settings.devrevApiEndpoint}${devrevApiPaths.accountsList}?external_refs="${domain}"`
      const existingAccount: AccountListResponse = await request(requestUrl)
      if (existingAccount.data.accounts.length == 0) {
        // Create account
        const requestBody: CreateAccountBody = {
          display_name: domain,
          external_refs: [domain]
        }
        if (payload.tag)
          requestBody.tags = [{id: payload.tag}]
        if (domain != payload.email)
          requestBody.domains = [domain]

        
        const createAccount: AccountGet = await request(
          `${settings.devrevApiEndpoint}${devrevApiPaths.accountCreate}`,
          {
            method: 'post',
            json: requestBody
          }
        )
        accountId = createAccount.data.account.id
      } else {
        // Use existing account
        accountId = existingAccount.data.accounts[0].id
      }
        const accountRevorgs: RevOrgListResponse = await request(
          `${settings.devrevApiEndpoint}${devrevApiPaths.revOrgsList}?account=${accountId}`
        )
        const filtered = accountRevorgs.data.rev_orgs.filter((revorg) => revorg.external_ref_issuer == 'devrev:platform:revorg:account')
        revOrgId = filtered[0].id
        const createRevUser: RevUserGet = await request(
          `${settings.devrevApiEndpoint}${devrevApiPaths.revUsersCreate}`,
          {
            method: 'post',
            json: {
              email: payload.email,
              full_name: payload.fullName,
              external_ref: payload.email,
              org_id: revOrgId
            }
          }
        )
        revUserId = createRevUser.data.rev_user.id
      
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
    if (payload.comment) {
      await request(`${settings.devrevApiEndpoint}${devrevApiPaths.timelineEntriesCreate}`, {
        method: 'post',
        json: {
          object: revUserId,
          type: 'timeline_comment',
          body_type: 'text',
          body: payload.comment
        }
      })
    }
    return
  }
}

export default action
