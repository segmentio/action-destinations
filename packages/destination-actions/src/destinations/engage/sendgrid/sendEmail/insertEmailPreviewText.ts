import cheerio from 'cheerio'
import { htmlEscape } from 'escape-goat'

export function insertEmailPreviewText(html: string, previewText: string): string {
  const $ = cheerio.load(html)

  // See https://www.litmus.com/blog/the-little-known-preview-text-hack-you-may-want-to-use-in-every-email/
  $('body').prepend(`
    <div style='display: none; max-height: 0px; overflow: hidden;'>
      ${htmlEscape(previewText)}
    </div>

    <div style='display: none; max-height: 0px; overflow: hidden;'>
      ${'&nbsp;&zwnj;'.repeat(13)}&nbsp;
    </div>
  `)

  return $.html()
}
