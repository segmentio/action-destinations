export type ExecJSONRequest = {
  sql: string // The SQL query
  database: string // The name of the database
  args?: FlattenedArgs
}

export type ExecJSONResponse = {
  ok?: boolean // Indicates whether the query was successful
  error?: string
}

export type FlatArgsTuple = [
  string, // messageid
  string, // timestamp
  string, // type
  string | null, // event
  string | null, // name
  Record<string, unknown> | null, // properties
  string | null, // userId
  string | null, // anonymousId
  string | null, // groupId
  Record<string, unknown> | null, // traits
  Record<string, unknown> | null // context
]

export type FlattenedArgs = FlatArgsTuple[number][]
