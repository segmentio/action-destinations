// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Property which uniquely identifies each row in the spreadsheet.
   */
  record_identifier: string
  /**
   * Describes the nature of the operation being performed. Only supported values are 'new' and 'updated'.
   */
  operation_type: string
  /**
   * The identifier of the spreadsheet. You can find this value in the URL of the spreadsheet. e.g. https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit
   */
  spreadsheet_id: string
  /**
   * The name of the spreadsheet. You can find this value on the tab at the bottom of the spreadsheet. Please provide a valid name of a sheet that already exists.
   */
  spreadsheet_name: string
  /**
   * The way Google will interpret values. If you select raw, values will not be parsed and will be stored as-is. If you select user entered, values will be parsed as if you typed them into the UI. Numbers will stay as numbers, but strings may be converted to numbers, dates, etc. following the same rules that are applied when entering text into a cell via the Google Sheets UI.
   */
  data_format: string
  /**
   *
   *   The fields to write to the spreadsheet.
   *
   *   On the left-hand side, input the name of the field as it will appear in the Google Sheet.
   *
   *   On the right-hand side, select the field from your data model that maps to the given field in your sheet.
   *
   *   ---
   *
   *
   */
  fields: {
    [k: string]: unknown
  }
  /**
   * Set as true to ensure Segment sends data to Google Sheets in batches. Please do not set to false.
   */
  enable_batching?: boolean
}
