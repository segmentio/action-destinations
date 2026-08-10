import * as fs from 'fs'
import * as path from 'path'
import { validateSubdomain } from '../sfmc-operations'

// TEMP audit — verify the SUBDOMAIN_PATTERN regex won't reject any subdomain currently
// stored in the settings DB (Snowflake export). NOT part of the shipped suite; delete
// after running. See SECOPS-25213 PR review.
const CSV_PATH = '/Users/hjoshi/Downloads/Untitled_2026-08-04-1121.csv'
const REPORT_PATH = path.join(__dirname, 'subdomain-db-audit-failures.txt')

// Minimal RFC-4180 CSV parser: handles quoted fields, embedded commas/newlines, and
// doubled ("") quote escaping. Returns rows as string[][].
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else if (c === '\r') {
      // ignore, handled by \n
    } else {
      field += c
    }
  }
  // trailing field/row
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

describe('SFMC subdomain DB audit (temp)', () => {
  it('reports every stored subdomain the regex would reject', () => {
    const text = fs.readFileSync(CSV_PATH, 'utf8')
    const rows = parseCsv(text)
    const header = rows[0]
    const valueIdx = header.indexOf('VALUE')
    const configIdx = header.indexOf('CONFIG_ID')
    const updatedIdx = header.indexOf('UPDATED_AT')

    const failures: string[] = []
    let total = 0
    let empty = 0

    for (const r of rows.slice(1)) {
      if (r.length <= valueIdx) continue
      total++
      // The VALUE field is itself a JSON string, so it still carries surrounding
      // double quotes after CSV unescaping (e.g. `"mc..."`). Strip one JSON layer.
      const raw = r[valueIdx]
      let subdomain = raw
      if (subdomain.startsWith('"') && subdomain.endsWith('"')) {
        subdomain = subdomain.slice(1, -1)
      }

      if (subdomain === '') empty++

      try {
        validateSubdomain(subdomain)
      } catch {
        failures.push(`CONFIG_ID=${r[configIdx]}\tUPDATED_AT=${r[updatedIdx]}\tsubdomain=${JSON.stringify(subdomain)}`)
      }
    }

    const summary = [
      `Total subdomain rows checked: ${total}`,
      `Empty-string subdomains: ${empty}`,
      `Rows the regex would REJECT: ${failures.length}`,
      '',
      ...failures
    ].join('\n')

    fs.writeFileSync(REPORT_PATH, summary + '\n')

    // eslint-disable-next-line no-console
    console.log(`\n===== SFMC subdomain DB audit =====\n${summary}\n(report written to ${REPORT_PATH})`)
  })
})
