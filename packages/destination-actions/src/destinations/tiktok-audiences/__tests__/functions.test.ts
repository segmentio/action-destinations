import { extractUsers } from '../functions'

describe('TikTok Audiences Functions', () => {
  describe('extractUsers', () => {
    it('Should hash email address when email is in a plain format', () => {
      const payload = {
        email: 'scroogemcduck@disney.com',
        send_email: true,
        audience_id: '1234567890'
      }

      const result: any[][] = extractUsers([payload])
      expect(result[0][0].id).toEqual('77bc071241f37b4736df28c0c1cb0a99163d1050696134325b99246b2183d408')
    })

    it('Should NOT hash email address when email is already hashed', () => {
      const payload = {
        email: '77bc071241f37b4736df28c0c1cb0a99163d1050696134325b99246b2183d408',
        send_email: true,
        audience_id: '1234567890'
      }

      const result: any[][] = extractUsers([payload])
      expect(result[0][0].id).toEqual('77bc071241f37b4736df28c0c1cb0a99163d1050696134325b99246b2183d408')
    })
  })
})
