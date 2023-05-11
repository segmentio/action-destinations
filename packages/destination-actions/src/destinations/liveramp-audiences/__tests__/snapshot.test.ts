import { enquoteIdentifier } from '../operations'

const destinationSlug = 'LiverampAudiences'

describe(`Testing snapshot for ${destinationSlug}'s destination action:`, () => {
  it('enquotated indentifier data', async () => {
    const identifiers = [`LCD TV,50"`, `"early-bird" special`, `5'8"`]
    const enquotedIdentifiers = identifiers.map(enquoteIdentifier)

    expect(enquotedIdentifiers).toMatchSnapshot()
  })
})
