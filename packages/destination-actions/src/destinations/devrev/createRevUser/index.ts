import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { DynamicFieldResponse } from '@segment/actions-core'
import {
  AccountListResponse,
  RevOrgListResponse,
  RevUserGet,
  RevUserListResponse,
  TagsResponse,
  getDomain,
  devrevApiPaths,
  getName,
  getBaseUrl,
  CreateRevUserBody,
  RevUser,
  CreateAccountBody,
  AccountGet
} from '../utils'
import { APIError } from '@segment/actions-core'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Create Rev User',
  defaultSubscription: 'type = "identify"',
  description:
    'Creates a RevUser, unless one already exists with the same email address. Posts the comment to the RevUser object if it is created or if it already exists.',
  fields: {
    email: {
      label: 'Email',
      description: "The user's email address.",
      type: 'string',
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.traits.email' },
          then: { '@path': '$.traits.email' },
          else: { '@path': '$.properties.email' }
        }
      }
    },
    fullName: {
      label: 'Full Name',
      description: "The user's full name.",
      type: 'string',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.traits.name' },
          then: { '@path': '$.traits.name' },
          else: { '@path': '$.properties.name' }
        }
      }
    },
    firstName: {
      label: 'First Name',
      description: "The user's first name.",
      type: 'string',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.traits.first_name' },
          then: { '@path': '$.traits.first_name' },
          else: { '@path': '$.properties.first_name' }
        }
      }
    },
    lastName: {
      label: 'Last Name',
      description: "The user's last name.",
      type: 'string',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.traits.last_name' },
          then: { '@path': '$.traits.last_name' },
          else: { '@path': '$.properties.last_name' }
        }
      }
    },
    comment: {
      label: 'Comment',
      description:
        'A comment to post to the RevUser. If empty, no comment will be posted on the RevUser, otherwise the comment will be posted to the RevUser. The comment will be posted even if the RevUser already exists on the RevDev platform',
      type: 'string',
      required: false
    },
    tag: {
      label: 'Tag',
      description: 'A tag to apply.',
      type: 'string',
      dynamic: true,
      required: false
    }
  },
  dynamicFields: {
    tag: async (request, { settings }): Promise<DynamicFieldResponse> => {
      try {
        const result: TagsResponse = await request(`${getBaseUrl(settings)}${devrevApiPaths.tagsList}`, {
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
    const email = payload.email.toLowerCase()
    const domain = getDomain(settings, email)
    const name = getName(payload)
    const existingUsers: RevUserListResponse = await request(
      `${getBaseUrl(settings)}${devrevApiPaths.revUsersList}?email="${email}"`
    )
    let contact: RevUser | undefined = undefined
    if (existingUsers.data.rev_users.length == 0) {
      // No existing revusers, search for Account
      // Create the payload
      const createUserPayload: CreateRevUserBody = {
        email,
        display_name: name,
        external_ref: email
      }

      let requestUrl = ''
      //Search using domain if the email domain is not blacklisted
      // Otherwise search the external refs
      if (domain !== email) requestUrl = `${getBaseUrl(settings)}${devrevApiPaths.accountsList}?domains="${domain}"`
      else requestUrl = `${getBaseUrl(settings)}${devrevApiPaths.accountsList}?external_refs="${domain}"`
      const existingAccount: AccountListResponse = await request(requestUrl)
      let accountId = ''
      if (existingAccount.data.accounts.length > 0) {
        accountId = existingAccount.data.accounts[0].id
      } else if (domain !== email) {
        // if the domain is equal to the email, we know that the domain is blacklisted.
        // If there is not any account found already and the domain is not blacklisted we create a new account
        const createAccountPayload: CreateAccountBody = {
          display_name: domain,
          external_refs: [domain],
          domains: [domain]
        }
        if (payload.tag) createAccountPayload.tags = [{ id: payload.tag }]
        const createAccount: AccountGet = await request(`${getBaseUrl(settings)}${devrevApiPaths.accountCreate}`, {
          method: 'POST',
          json: createAccountPayload
        })
        accountId = createAccount.data.account.id
      }
      // If we found or created an account, find the workspace and add it to the payload
      if (accountId) {
        const accountRevorgs: RevOrgListResponse = await request(
          `${getBaseUrl(settings)}${devrevApiPaths.revOrgsList}?account=${accountId}`
        )
        const filtered = accountRevorgs.data.rev_orgs.filter(
          (revorg) => revorg.external_ref_issuer == 'devrev:platform:revorg:account'
        )
        if (filtered.length > 0) createUserPayload.org_id = filtered[0].id
      }
      // If there is a tag configured, apply it
      if (payload.tag) createUserPayload.tags = [{ id: payload.tag }]
      const createRevUser: RevUserGet = await request(`${getBaseUrl(settings)}${devrevApiPaths.revUsersCreate}`, {
        method: 'post',
        json: createUserPayload
      })
      contact = createRevUser.data.rev_user
    } else if (existingUsers.data.rev_users.length == 1) {
      // One existing revuser
      contact = existingUsers.data.rev_users[0]
    } else {
      // Multiple existing users, use the oldest one
      const sorted = existingUsers.data.rev_users.sort((a, b) => {
        return new Date(a.created_date).getTime() - new Date(b.created_date).getTime()
      })
      contact = sorted[0]
    }
    if (payload.tag && contact) {
      const tags = contact.tags?.map((tag) => tag.tag.id) ?? []
      if (tags.indexOf(payload.tag) === -1) {
        tags.push(payload.tag)
        const formattedTags = tags.map((tag) => ({ id: tag }))
        await request(`${getBaseUrl(settings)}${devrevApiPaths.revUsersUpdate}`, {
          method: 'post',
          json: {
            id: contact.id,
            tags: formattedTags
          }
        })
      }
    }
    if (payload.comment && contact) {
      await request(`${getBaseUrl(settings)}${devrevApiPaths.timelineEntriesCreate}`, {
        method: 'post',
        json: {
          object: contact.id,
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
