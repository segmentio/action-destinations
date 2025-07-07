
export type ExecJSONRequest = {
  sql: string // The SQL query
  database: string // The name of the database
  args?: {
    [k: string]: unknown
  }[]
}

export type ExecJSONResponse = {
  ok?: boolean // Indicates whether the query was successful
  error?: string
}
