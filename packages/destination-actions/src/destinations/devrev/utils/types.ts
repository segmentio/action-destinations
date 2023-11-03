export interface IdFragment {
  id: string
  display_name: string
}

export interface Tag {
  id: string
  name: string
}

export interface Part {
  type: string
  id: string
  name: string
}

export interface PartListResponse {
  data: {
    next_cursor: string
    parts: Part[]
  }
}

export interface TagsResponse {
  data: {
    next_cursor: string
    tags: Tag[]
  }
}

export interface Account extends IdFragment {
  domains?: string[]
  schema_fragment_ids?: string[]
  state?: string
  created_date?: string
}

export interface RevOrg extends IdFragment {
  id: string
  account: IdFragment
  display_name: string
  state: string
  created_date: string
  external_ref_issuer?: string
}

export interface RevUser extends IdFragment {
  created_date: string
  rev_org: IdFragment
  email: string
}

export interface DevUser extends IdFragment {
  full_name: string
  email: string
  id: string
}

export interface DevUserListResponse {
  data: {
    next_cursor?: string
    dev_users: DevUser[]
  }
}

export interface RevUserListResponse {
  data: {
    next_cursor?: string
    rev_users: RevUser[]
  }
}

export interface RevOrgListResponse {
  data: {
    next_cursor?: string
    rev_orgs: RevOrg[]
  }
}

export interface AccountListResponse {
  data: {
    next_cursor?: string
    accounts: Account[]
  }
}

export interface RevUserGet {
  data: {
    rev_user: RevUser
  }
}

export interface RevOrgGet {
  data: {
    rev_org: RevOrg
  }
}

export interface AccountGet {
  data: {
    account: Account
  }
}

export interface Comment {
  id: string
  body: string
}
export interface TimelineResponse {
  data: {
    timeline_entry: Comment
  }
}

export interface CreateAccountBody {
  display_name: string
  domains?: string[]
  tags?: { id: string }[]
  external_refs: string[]
}

export interface TraceEvent {
  event_time: string
  name: string
  payload: object
}

export interface TrackEventsPublishBody {
  events_list: TraceEvent[]
}

export interface JwtPayload {
  aud: string[]
  azp: string
  exp: number
  'http://devrev.ai/auth0_user_id': string
  'http://devrev.ai/devo_don': string
  'http://devrev.ai/devoid': string
  'http://devrev.ai/devuid': string
  'http://devrev.ai/displayname': string
  'http://devrev.ai/email': string
  'http://devrev.ai/fullname': string
  'http://devrev.ai/tokentype': string
  iat: number
  iss: string
  jti: string
  org_id: string
  sub: string
}
