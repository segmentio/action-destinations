
export type ExecJSONRequest = {
  sql: string // The SQL query
  database: string // The name of the database
  args?: any[] // An optional list of arguments to be used in the SQL query
}

export type ExecJSONResponse = {
  ok: boolean // Indicates whether the query was successful
  error?: string
}
