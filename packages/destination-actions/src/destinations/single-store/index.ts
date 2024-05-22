import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import sendData from './sendData'

const destination: DestinationDefinition<Settings> = {
  name: 'Single Store',
  slug: 'actions-single-store',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      host: {
        label: 'Host',
        description: 'The SingleStore Connection String. You can find this by TODO...',
        type: 'string',
        required: true
      },
      port: {
        label: 'Port',
        description: 'TODO',
        type: 'string',
        required: true,
        default: '3306'
      },
      username: {
        label: 'Username',
        description: 'TODO',
        type: 'string',
        required: true
      },
      password: {
        label: 'Password',
        description: 'TODO',
        type: 'password',
        required: true
      },
      database: {
        label: 'Database',
        description: 'TODO',
        type: 'string',
        required: true
      }
    },
    testAuthentication: async (_) => {
      
      
      
      // https://www.npmjs.com/package/mysql2

      // import mysql from 'mysql2/promise';

      // // Create the connection to database
      // const connection = await mysql.createConnection({
      //   host: 'localhost',
      //   user: 'root',
      //   database: 'test',
      // });

      // // A simple SELECT query
      // try {
      //   const [results, fields] = await connection.query(
      //     'SELECT * FROM `table` WHERE `name` = "Page" AND `age` > 45'
      //   );

      //   console.log(results); // results contains rows returned by server
      //   console.log(fields); // fields contains extra meta data about results, if available
      // } catch (err) {
      //   console.log(err);
      // }

      // // Using placeholders
      // try {
      //   const [results] = await connection.query(
      //     'SELECT * FROM `table` WHERE `name` = ? AND `age` > ?',
      //     ['Page', 45]
      //   );

      //   console.log(results);
      // } catch (err) {
      //   console.log(err);
      // }
      
    }
  },

  actions: {
    sendData
  }
}

export default destination
