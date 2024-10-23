import { DestinationDefinition, IntegrationError, InvalidAuthenticationError } from '@segment/actions-core'
import { Settings } from './generated-types'
import { SingleStoreCreateJSON } from './types'
import { createUrl, xSecurityKey } from './const'
import send from './send'
import { createHash } from 'crypto'
import { encryptText } from './util'

const destination: DestinationDefinition<Settings> = {
  name: 'Singlestore',
  slug: 'actions-singlestore',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      host: {
        label: 'Host',
        description: 'The host of the Singlestore database.',
        type: 'string',
        required: true
      },
      port: {
        label: 'Port',
        description: 'The port of the Singlestore database.',
        type: 'number',
        required: true,
        default: 3306
      },
      username: {
        label: 'Username',
        description: 'The username of the Singlestore database.',
        type: 'string',
        required: true
      },
      password: {
        label: 'Password',
        description: 'The password of the Singlestore database.',
        type: 'password',
        required: true
      },
      dbName: {
        label: 'Database Name',
        description: 'The name of the database.',
        type: 'string',
        required: true  
      },
      environment: {
        label: 'Environment',
        description: 'The environment of the Singlestore database.',
        type: 'string',
        required: true,
        choices: [
          {
            value: 'Prod',
            label: 'Prod'
          },
          {
            value: 'Stage',
            label: 'Stage'
          }
        ],
        default: 'Prod'
      }
    },
    testAuthentication: async (request, { settings /*, subscriptionMetadata */ }) => {
      //TODO
      console.log(settings);

      const databaseUri = `${settings.username}@${settings.host}:${settings.port}/${settings.dbName}`;
      const destinationId = createHash('sha256').update(databaseUri).digest('hex');
      if (!destinationId) {
        throw new IntegrationError('Destination Id is missing', 'MISSING_DESTINATION_ID', 400)
      }
      console.log(`Database Uri: ${databaseUri}`);
      console.log(`DestinationId: ${destinationId}`);

      const kafkaTopic = createHash('sha256').update(destinationId).digest('hex')
      const kafkaUsername = createHash('sha256').update(`${destinationId}_user`).digest('hex'); //.substring(0, 12)
      const kafkaPassword = await encryptText(kafkaUsername);

      const json: SingleStoreCreateJSON = { 
        ...settings, 
        kafkaUsername,
        kafkaPassword,
        kafkaTopic, 
        destinationIdentifier: destinationId,
        noRollbackOnFailure: true 
      }
      console.log(`Sending data to orchestrator: ${JSON.stringify(json)}`);
      let res;
      try {
        res = await request(createUrl, {
          headers: {
            "x-security-key": xSecurityKey
          }, 
          throwHttpErrors: false,
          json, 
          method: 'POST',
          //timeout: 1000
        });

      } catch (err: any) {
        console.error(`Error raised while trying to send to orchestrator: ${err.message}`);
        //TO DO: Can we return a different message, even if successful, so if there's a timeout, we just tell them that it's taking longer than normal
        return Promise.resolve("Configuration is taking a bit longer than normal...");
      }

      console.log("Finished request");

      if (res?.status != 200) {
        console.error(`Error occurred while trying to configure SingleStore`);
        const messageBody = JSON.parse(JSON.stringify(res?.data));
        console.error(JSON.stringify(messageBody));
        throw new InvalidAuthenticationError(`${messageBody.error}`);
      }

      console.log(res);
      console.log("Done!")
      return res;
      return Promise.resolve() 
    }
  },
  actions: {
    send
  }
}

export default destination
