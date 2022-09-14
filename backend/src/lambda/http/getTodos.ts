// import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'

import { getUserId } from '../utils';
import { getTodosForUser } from '../../helpers/todos'
import { Key } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../../utils/logger';


const logger = createLogger('function:getTodos');

// TODO: Get all TODO items for a current user
export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    // Write your code here
    logger.info('Attempting to get todos', { event });
    const userId = getUserId(event);
    let startKey: Key;
    const cursor = event.queryStringParameters && event.queryStringParameters.cursor;
    if (cursor) {
      startKey = JSON.parse(decodeURIComponent(cursor));
    }

    logger.info('Obtained request details', { userId, startKey });
    const { todos, evaluatedKey } = await getTodosForUser(userId, startKey);

    logger.info('Retrieved todos');

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        items: todos,
        cursor: encodeURIComponent(JSON.stringify(evaluatedKey)),
      }),
    };
  }
);

handler.use(
  cors({
    credentials: true
  })
)
