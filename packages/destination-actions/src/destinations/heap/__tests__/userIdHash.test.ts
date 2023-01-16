import { getHeapUserId } from '../userIdHash'

describe('Hashing Heap user ID', () => {
  it('should return correct hashed user ID', () => {
    const segmentAnonymousUserId = '5a41f0df-b69a-4a99-b656-79506a86c3f8'
    // I validated that this is consistent with Heap implementation.
    const expectedHashedUserId = 8325872782136936
    const generatedUserId = getHeapUserId(segmentAnonymousUserId)
    expect(generatedUserId).toBe(expectedHashedUserId)
  })
})
