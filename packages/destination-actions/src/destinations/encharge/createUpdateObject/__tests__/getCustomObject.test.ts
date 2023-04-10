import { getCustomObjects } from '../getCustomObjects'

describe('getCustomObjects', () => {
  it('should return a list of custom objects', async () => {
    const request = jest.fn().mockImplementation(() => ({
      data: {
        objects: [
          {
            name: 'company',
            displayNameSingular: 'Company'
          },
          {
            name: 'invoice',
            displayNameSingular: 'Invoice'
          }
        ]
      }
    }))

    const response = await getCustomObjects(request)

    expect(response).toEqual({
      choices: [
        {
          label: 'Company',
          value: 'company'
        },
        {
          label: 'Invoice',
          value: 'invoice'
        }
      ]
    })
  })
})
