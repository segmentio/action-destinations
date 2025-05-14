import nock from 'nock'
import { createTestEvent, createTestIntegration, SegmentEvent } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const timestamp = new Date('Thu Jun 10 2024 11:08:04 GMT-0700 (Pacific Daylight Time)').toISOString()
const profileId = '12345'
const floodlightActivityId = '23456'
const floodlightConfigurationId = '34567'

describe('CampaignManager360.conversionAdjustmentUpload', () => {
  describe('Successful scenarios', () => {
    describe('Single event', () => {
      it('sends an event with default mappings + default settings, plain data', async () => {
        const event = createTestEvent({
          timestamp,
          event: 'Test Event',
          context: {
            traits: {
              email: 'daffy@warnerbros.com',
              phone: '1234567890',
              firstName: 'Daffy',
              lastName: 'Duck',
              streetAddress: '123 Daffy St',
              city: 'Burbank',
              state: 'CA',
              postalCode: '98765',
              countryCode: 'US'
            }
          },
          properties: {
            ordinal: '1',
            quantity: '2',
            value: '100',
            gclid: '54321',
            limitAdTracking: true,
            childDirectedTreatment: true,
            nonPersonalizedAd: true,
            treatmentForUnderage: true
          }
        })

        delete event.userId

        nock(`https://dfareporting.googleapis.com/dfareporting/v4/userprofiles/${profileId}/conversions/batchupdate`)
          .post('')
          .reply(200, { results: [{}] })

        const responses = await testDestination.testAction('conversionAdjustmentUpload', {
          event,
          mapping: {
            requiredId: {
              gclid: {
                '@path': '$.properties.gclid'
              }
            },
            timestamp: {
              '@path': '$.timestamp'
            },
            value: {
              '@path': '$.properties.value'
            },
            quantity: {
              '@path': '$.properties.quantity'
            },
            ordinal: {
              '@path': '$.properties.ordinal'
            },
            userDetails: {
              email: {
                '@path': '$.context.traits.email'
              },
              phone: {
                '@path': '$.context.traits.phone'
              },
              firstName: {
                '@path': '$.context.traits.firstName'
              },
              lastName: {
                '@path': '$.context.traits.lastName'
              },
              streetAddress: {
                '@path': '$.context.traits.streetAddress'
              },
              city: {
                '@path': '$.context.traits.city'
              },
              state: {
                '@path': '$.context.traits.state'
              },
              postalCode: {
                '@path': '$.context.traits.postalCode'
              },
              countryCode: {
                '@path': '$.context.traits.countryCode'
              }
            },
            limitAdTracking: {
              '@path': '$.properties.limitAdTracking'
            },
            childDirectedTreatment: {
              '@path': '$.properties.childDirectedTreatment'
            },
            nonPersonalizedAd: {
              '@path': '$.properties.nonPersonalizedAd'
            },
            treatmentForUnderage: {
              '@path': '$.properties.treatmentForUnderage'
            }
          },
          useDefaultMappings: true,
          settings: {
            profileId,
            defaultFloodlightActivityId: floodlightActivityId,
            defaultFloodlightConfigurationId: floodlightConfigurationId
          }
        })

        expect(responses.length).toBe(1)
        expect(responses[0].status).toBe(200)
      })

      it('sends an event with default mappings + default settings, hashed data', async () => {
        const event = createTestEvent({
          timestamp,
          event: 'Test Event',
          context: {
            traits: {
              email: '8e46bd4eaabb5d6324e327751b599f190dbaacd90066e66c94a046640bed60d0',
              phone: 'c775e7b757ede630cd0aa1113bd102661ab38829ca52a6422ab782862f268646',
              firstName: 'a628aa64f14c8196c8c82c7ffb6482b2db7431e4cb5b28cd313004ce7ba4eb66',
              lastName: '3b67f1c91f4f245f6e219b364782ac53e912420f2284bf6a700e9cf71fbeafac',
              streetAddress: '75d8b0ba2a20d1855cf768d65016a066b856b442fec6b33264b11016ba88efc3',
              city: 'Burbank',
              state: 'CA',
              postalCode: '98765',
              countryCode: 'US'
            }
          },
          properties: {
            ordinal: '1',
            quantity: '2',
            value: '100',
            dclid: '54321'
          }
        })

        nock(`https://dfareporting.googleapis.com/dfareporting/v4/userprofiles/${profileId}/conversions/batchupdate`)
          .post('')
          .reply(200, { results: [{}] })

        const responses = await testDestination.testAction('conversionAdjustmentUpload', {
          event,
          mapping: {
            requiredId: {
              dclid: {
                '@path': '$.properties.dclid'
              }
            },
            timestamp: {
              '@path': '$.timestamp'
            },
            value: {
              '@path': '$.properties.value'
            },
            quantity: {
              '@path': '$.properties.quantity'
            },
            ordinal: {
              '@path': '$.properties.ordinal'
            },
            userDetails: {
              email: {
                '@path': '$.context.traits.email'
              },
              phone: {
                '@path': '$.context.traits.phone'
              },
              firstName: {
                '@path': '$.context.traits.firstName'
              },
              lastName: {
                '@path': '$.context.traits.lastName'
              },
              streetAddress: {
                '@path': '$.context.traits.streetAddress'
              },
              city: {
                '@path': '$.context.traits.city'
              },
              state: {
                '@path': '$.context.traits.state'
              },
              postalCode: {
                '@path': '$.context.traits.postalCode'
              },
              countryCode: {
                '@path': '$.context.traits.countryCode'
              }
            }
          },
          useDefaultMappings: true,
          settings: {
            profileId,
            defaultFloodlightActivityId: floodlightActivityId,
            defaultFloodlightConfigurationId: floodlightConfigurationId
          }
        })

        expect(responses.length).toBe(1)
        expect(responses[0].status).toBe(200)
      })

      it('sends an event with default mappings + default settings, no user details', async () => {
        const event = createTestEvent({
          timestamp,
          event: 'Test Event',
          properties: {
            ordinal: '1',
            quantity: '2',
            value: '100',
            encryptedUserId: '54321'
          }
        })

        nock(`https://dfareporting.googleapis.com/dfareporting/v4/userprofiles/${profileId}/conversions/batchupdate`)
          .post('')
          .reply(200, { results: [{}] })

        const responses = await testDestination.testAction('conversionAdjustmentUpload', {
          event,
          mapping: {
            requiredId: {
              encryptedUserId: {
                '@path': '$.properties.encryptedUserId'
              }
            },
            timestamp: {
              '@path': '$.timestamp'
            },
            value: {
              '@path': '$.properties.value'
            },
            quantity: {
              '@path': '$.properties.quantity'
            },
            ordinal: {
              '@path': '$.properties.ordinal'
            },
            encryptionInfo: {
              encryptionEntityId: '12345',
              encryptionEntityType: 'ADWORDS_CUSTOMER',
              encryptionSource: 'AD_SERVING'
            }
          },
          useDefaultMappings: true,
          settings: {
            profileId,
            defaultFloodlightActivityId: floodlightActivityId,
            defaultFloodlightConfigurationId: floodlightConfigurationId
          }
        })

        expect(responses.length).toBe(1)
        expect(responses[0].status).toBe(200)
      })

      it('sends an event and handles hashing with partial data correctly', async () => {
        const event = createTestEvent({
          timestamp,
          event: 'Test Event',
          context: {
            traits: {
              email: 'daffy@warnerbros.com'
            }
          },
          properties: {
            ordinal: '1',
            quantity: '2',
            value: '100',
            gclid: '54321',
            limitAdTracking: true,
            childDirectedTreatment: true,
            nonPersonalizedAd: true,
            treatmentForUnderage: true
          }
        })

        delete event.userId

        nock(`https://dfareporting.googleapis.com/dfareporting/v4/userprofiles/${profileId}/conversions/batchupdate`)
          .post('')
          .reply(200, { results: [{}] })

        const responses = await testDestination.testAction('conversionAdjustmentUpload', {
          event,
          mapping: {
            requiredId: {
              gclid: {
                '@path': '$.properties.gclid'
              }
            },
            timestamp: {
              '@path': '$.timestamp'
            },
            value: {
              '@path': '$.properties.value'
            },
            quantity: {
              '@path': '$.properties.quantity'
            },
            ordinal: {
              '@path': '$.properties.ordinal'
            },
            userDetails: {
              email: {
                '@path': '$.context.traits.email'
              },
              phone: {
                '@path': '$.context.traits.phone'
              },
              firstName: {
                '@path': '$.context.traits.firstName'
              },
              lastName: {
                '@path': '$.context.traits.lastName'
              },
              streetAddress: {
                '@path': '$.context.traits.streetAddress'
              },
              city: {
                '@path': '$.context.traits.city'
              },
              state: {
                '@path': '$.context.traits.state'
              },
              postalCode: {
                '@path': '$.context.traits.postalCode'
              },
              countryCode: {
                '@path': '$.context.traits.countryCode'
              }
            },
            limitAdTracking: {
              '@path': '$.properties.limitAdTracking'
            },
            childDirectedTreatment: {
              '@path': '$.properties.childDirectedTreatment'
            },
            nonPersonalizedAd: {
              '@path': '$.properties.nonPersonalizedAd'
            },
            treatmentForUnderage: {
              '@path': '$.properties.treatmentForUnderage'
            }
          },
          useDefaultMappings: true,
          settings: {
            profileId,
            defaultFloodlightActivityId: floodlightActivityId,
            defaultFloodlightConfigurationId: floodlightConfigurationId
          }
        })

        expect(responses[0].options.body).toBe(
          `{"conversions":[{"childDirectedTreatment":true,"floodlightActivityId":"23456","floodlightConfigurationId":"34567","gclid":"54321","kind":"dfareporting#conversion","limitAdTracking":true,"nonPersonalizedAd":true,"ordinal":"1","quantity":"2","timestampMicros":"1718042884000000","treatmentForUnderage":true,"userIdentifiers":[{"hashedEmail":"8e46bd4eaabb5d6324e327751b599f190dbaacd90066e66c94a046640bed60d0"}],"value":100,"customVariables":[],"encryptedUserIdCandidates":[]}],"kind":"dfareporting#conversionsBatchInsertRequest"}`
        )
        expect(responses.length).toBe(1)
        expect(responses[0].status).toBe(200)
      })
    })

    describe('Batch', () => {
      it('sends a batch of events with default mappings + default settings, plain data', async () => {
        const goodBatch: SegmentEvent[] = [
          {
            type: 'track',
            event: 'Test Event',
            timestamp,
            context: {
              traits: {
                email: 'daffy@warnerbros.com',
                phone: '1234567890',
                firstName: 'Daffy',
                lastName: 'Duck',
                streetAddress: '123 Daffy St',
                city: 'Burbank',
                state: 'CA',
                postalCode: '98765',
                countryCode: 'US'
              }
            },
            properties: {
              ordinal: '1',
              quantity: '1',
              value: '123',
              mobileDeviceId: '54321'
            }
          },
          {
            type: 'track',
            event: 'Test Event',
            timestamp,
            context: {
              traits: {
                email: 'bugs@warnerbros.com',
                phone: '1234567891',
                firstName: 'Bugs',
                lastName: 'Bunny',
                streetAddress: '123 Doc St',
                city: 'Burbank',
                state: 'CA',
                postalCode: '98765',
                countryCode: 'US'
              }
            },
            properties: {
              ordinal: '1',
              quantity: '1',
              value: '234',
              matchId: '54322'
            }
          }
        ]

        nock(`https://dfareporting.googleapis.com/dfareporting/v4/userprofiles/${profileId}/conversions/batchupdate`)
          .post('')
          .reply(201, { results: [{}] })

        const responses = await testDestination.testBatchAction('conversionAdjustmentUpload', {
          events: goodBatch,
          mapping: {
            requiredId: {
              matchId: {
                '@path': '$.properties.matchId'
              },
              mobileDeviceId: {
                '@path': '$.properties.mobileDeviceId'
              }
            },
            timestamp: {
              '@path': '$.timestamp'
            },
            value: {
              '@path': '$.properties.value'
            },
            quantity: {
              '@path': '$.properties.quantity'
            },
            ordinal: {
              '@path': '$.properties.ordinal'
            },
            userDetails: {
              email: {
                '@path': '$.context.traits.email'
              },
              phone: {
                '@path': '$.context.traits.phone'
              },
              firstName: {
                '@path': '$.context.traits.firstName'
              },
              lastName: {
                '@path': '$.context.traits.lastName'
              },
              streetAddress: {
                '@path': '$.context.traits.streetAddress'
              },
              city: {
                '@path': '$.context.traits.city'
              },
              state: {
                '@path': '$.context.traits.state'
              },
              postalCode: {
                '@path': '$.context.traits.postalCode'
              },
              countryCode: {
                '@path': '$.context.traits.countryCode'
              }
            }
          },
          useDefaultMappings: true,
          settings: {
            profileId,
            defaultFloodlightActivityId: floodlightActivityId,
            defaultFloodlightConfigurationId: floodlightConfigurationId
          }
        })

        expect(responses.length).toBe(1)
        expect(responses[0].status).toBe(201)
      })

      it('sends a batch of events with default mappings + default settings, hashed data', async () => {
        const goodBatch: SegmentEvent[] = [
          {
            type: 'track',
            event: 'Test Event',
            timestamp,
            context: {
              traits: {
                email: '8e46bd4eaabb5d6324e327751b599f190dbaacd90066e66c94a046640bed60d0',
                phone: 'c775e7b757ede630cd0aa1113bd102661ab38829ca52a6422ab782862f268646',
                firstName: 'a628aa64f14c8196c8c82c7ffb6482b2db7431e4cb5b28cd313004ce7ba4eb66',
                lastName: '3b67f1c91f4f245f6e219b364782ac53e912420f2284bf6a700e9cf71fbeafac',
                streetAddress: '75d8b0ba2a20d1855cf768d65016a066b856b442fec6b33264b11016ba88efc3',
                city: 'Burbank',
                state: 'CA',
                postalCode: '98765',
                countryCode: 'US'
              }
            },
            properties: {
              ordinal: '1',
              quantity: '1',
              value: '123',
              gclid: '54321',
              impressionId: '909090'
            }
          },
          {
            type: 'track',
            event: 'Test Event',
            timestamp,
            context: {
              traits: {
                email: 'ce4c7b4a4b35b8b4c8bfb38d4e881d8b3f563939f4e6c5e873b556c9313980af',
                phone: '523aa18ecb892c51fbdbe28c57e10a92419e0a73e8931e578b98baffccf99cdd',
                firstName: 'ff7c5467ce496637e5ba10662b7a90cde4ed9f8ef33f06fab0893b1c6c800845',
                lastName: '03dac94651a68d28f655022e51379654976ad275481fa006ffd0eff9e9e2b08a',
                streetAddress: '4ed79adb368d0fe12221a8587761006ffdc58ae87a4d78af999792cf56882dc9',
                city: 'Burbank',
                state: 'CA',
                postalCode: '98765',
                countryCode: 'US'
              }
            },
            properties: {
              ordinal: '1',
              quantity: '1',
              value: '234',
              gclid: '54322'
            }
          }
        ]

        nock(`https://dfareporting.googleapis.com/dfareporting/v4/userprofiles/${profileId}/conversions/batchupdate`)
          .post('')
          .reply(201, { results: [{}] })

        const responses = await testDestination.testBatchAction('conversionAdjustmentUpload', {
          events: goodBatch,
          mapping: {
            requiredId: {
              gclid: {
                '@path': '$.properties.gclid'
              }
            },
            impressionId: {
              '@path': '$.properties.impressionId'
            },
            timestamp: {
              '@path': '$.timestamp'
            },
            value: {
              '@path': '$.properties.value'
            },
            quantity: {
              '@path': '$.properties.quantity'
            },
            ordinal: {
              '@path': '$.properties.ordinal'
            },
            userDetails: {
              email: {
                '@path': '$.context.traits.email'
              },
              phone: {
                '@path': '$.context.traits.phone'
              },
              firstName: {
                '@path': '$.context.traits.firstName'
              },
              lastName: {
                '@path': '$.context.traits.lastName'
              },
              streetAddress: {
                '@path': '$.context.traits.streetAddress'
              },
              city: {
                '@path': '$.context.traits.city'
              },
              state: {
                '@path': '$.context.traits.state'
              },
              postalCode: {
                '@path': '$.context.traits.postalCode'
              },
              countryCode: {
                '@path': '$.context.traits.countryCode'
              }
            }
          },
          useDefaultMappings: true,
          settings: {
            profileId,
            defaultFloodlightActivityId: floodlightActivityId,
            defaultFloodlightConfigurationId: floodlightConfigurationId
          }
        })

        expect(responses.length).toBe(1)
        expect(responses[0].status).toBe(201)
      })

      it('sends a batch of events with default mappings + default settings, no user details', async () => {
        const goodBatch: SegmentEvent[] = [
          {
            type: 'track',
            event: 'Test Event',
            timestamp,
            properties: {
              ordinal: '1',
              quantity: '1',
              value: '123',
              gclid: '54321'
            }
          },
          {
            type: 'track',
            event: 'Test Event',
            timestamp,
            properties: {
              ordinal: '1',
              quantity: '1',
              value: '234',
              gclid: '54322'
            }
          }
        ]

        nock(`https://dfareporting.googleapis.com/dfareporting/v4/userprofiles/${profileId}/conversions/batchupdate`)
          .post('')
          .reply(201, { results: [{}] })

        const responses = await testDestination.testBatchAction('conversionAdjustmentUpload', {
          events: goodBatch,
          mapping: {
            requiredId: {
              gclid: {
                '@path': '$.properties.gclid'
              }
            },
            timestamp: {
              '@path': '$.timestamp'
            },
            value: {
              '@path': '$.properties.value'
            },
            quantity: {
              '@path': '$.properties.quantity'
            },
            ordinal: {
              '@path': '$.properties.ordinal'
            }
          },
          useDefaultMappings: true,
          settings: {
            profileId,
            defaultFloodlightActivityId: floodlightActivityId,
            defaultFloodlightConfigurationId: floodlightConfigurationId
          }
        })

        expect(responses.length).toBe(1)
        expect(responses[0].status).toBe(201)
      })
    })
  })

  describe('Error scenarios', () => {
    it('throws an error if the event is missing at least one required parameter', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Test Event',
        context: {
          traits: {
            email: 'daffy@warnerbros.com',
            phone: '1234567890',
            firstName: 'Daffy',
            lastName: 'Duck',
            streetAddress: '123 Daffy St',
            city: 'Burbank',
            state: 'CA',
            postalCode: '98765',
            countryCode: 'US'
          }
        },
        properties: {
          dclid: '',
          ordinal: '1',
          quantity: '2',
          value: '100'
        }
      })

      await expect(
        testDestination.testAction('conversionAdjustmentUpload', {
          event,
          mapping: {
            requiredId: {
              dclid: {
                '@path': '$.properties.dclid'
              }
            },
            timestamp: {
              '@path': '$.timestamp'
            },
            value: {
              '@path': '$.properties.value'
            },
            quantity: {
              '@path': '$.properties.quantity'
            },
            ordinal: {
              '@path': '$.properties.ordinal'
            },
            userDetails: {
              email: {
                '@path': '$.context.traits.email'
              },
              phone: {
                '@path': '$.context.traits.phone'
              },
              firstName: {
                '@path': '$.context.traits.firstName'
              },
              lastName: {
                '@path': '$.context.traits.lastName'
              },
              streetAddress: {
                '@path': '$.context.traits.streetAddress'
              },
              city: {
                '@path': '$.context.traits.city'
              },
              state: {
                '@path': '$.context.traits.state'
              },
              postalCode: {
                '@path': '$.context.traits.postalCode'
              },
              countryCode: {
                '@path': '$.context.traits.countryCode'
              }
            }
          },
          useDefaultMappings: true,
          settings: {
            profileId,
            defaultFloodlightActivityId: floodlightActivityId,
            defaultFloodlightConfigurationId: floodlightConfigurationId
          }
        })
      ).rejects.toThrowError()
    })

    it('throws an error if neither the settings nor the event define Floodlight parameters', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Test Event',
        context: {
          traits: {
            email: 'daffy@warnerbros.com',
            phone: '1234567890',
            firstName: 'Daffy',
            lastName: 'Duck',
            streetAddress: '123 Daffy St',
            city: 'Burbank',
            state: 'CA',
            postalCode: '98765',
            countryCode: 'US'
          }
        },
        properties: {
          ordinal: '1',
          quantity: '2',
          value: '100',
          gclid: '54321'
        }
      })

      await expect(
        testDestination.testAction('conversionAdjustmentUpload', {
          event,
          mapping: {
            requiredId: {
              gclid: {
                '@path': '$.properties.gclid'
              }
            },
            timestamp: {
              '@path': '$.timestamp'
            },
            value: {
              '@path': '$.properties.value'
            },
            quantity: {
              '@path': '$.properties.quantity'
            },
            ordinal: {
              '@path': '$.properties.ordinal'
            },
            userDetails: {
              email: {
                '@path': '$.context.traits.email'
              },
              phone: {
                '@path': '$.context.traits.phone'
              },
              firstName: {
                '@path': '$.context.traits.firstName'
              },
              lastName: {
                '@path': '$.context.traits.lastName'
              },
              streetAddress: {
                '@path': '$.context.traits.streetAddress'
              },
              city: {
                '@path': '$.context.traits.city'
              },
              state: {
                '@path': '$.context.traits.state'
              },
              postalCode: {
                '@path': '$.context.traits.postalCode'
              },
              countryCode: {
                '@path': '$.context.traits.countryCode'
              }
            }
          },
          useDefaultMappings: true,
          settings: {
            profileId
          }
        })
      ).rejects.toThrowError()
    })

    it('throws an error Floodlight parameters are partially defined', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Test Event',
        context: {
          traits: {
            email: 'daffy@warnerbros.com',
            phone: '1234567890',
            firstName: 'Daffy',
            lastName: 'Duck',
            streetAddress: '123 Daffy St',
            city: 'Burbank',
            state: 'CA',
            postalCode: '98765',
            countryCode: 'US'
          }
        },
        properties: {
          ordinal: '1',
          quantity: '2',
          value: '100',
          gclid: '54321',
          floodlightActivityId: '23456'
        }
      })

      await expect(
        testDestination.testAction('conversionAdjustmentUpload', {
          event,
          mapping: {
            requiredId: {
              gclid: {
                '@path': '$.properties.gclid'
              }
            },
            floodlightActivityId: {
              '@path': '$.properties.floodlightActivityId'
            },
            timestamp: {
              '@path': '$.timestamp'
            },
            value: {
              '@path': '$.properties.value'
            },
            quantity: {
              '@path': '$.properties.quantity'
            },
            ordinal: {
              '@path': '$.properties.ordinal'
            },
            userDetails: {
              email: {
                '@path': '$.context.traits.email'
              },
              phone: {
                '@path': '$.context.traits.phone'
              },
              firstName: {
                '@path': '$.context.traits.firstName'
              },
              lastName: {
                '@path': '$.context.traits.lastName'
              },
              streetAddress: {
                '@path': '$.context.traits.streetAddress'
              },
              city: {
                '@path': '$.context.traits.city'
              },
              state: {
                '@path': '$.context.traits.state'
              },
              postalCode: {
                '@path': '$.context.traits.postalCode'
              },
              countryCode: {
                '@path': '$.context.traits.countryCode'
              }
            }
          },
          useDefaultMappings: true,
          settings: {
            profileId
          }
        })
      ).rejects.toThrowError()
    })
  })
})
