import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient, Key } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'

const XAWS = AWSXRay.captureAWS(AWS)

// TODO: Implement the dataLayer logic
const logger = createLogger('TodosAccess')

export class TodosAccess {
    constructor(
        private client: DocumentClient = createDynamoDBClient(),
        private tableName = process.env.TODOS_TABLE,
    ) {}

    async createTodo(dto: CreateTodoRequest & { todoId: string; }, userId: string): Promise<TodoItem> {
        logger.info("Creating a new todo with name", dto)
        const data = {
            ...dto,
            userId,
            name: dto.name.trim(),
            createdAt: new Date().toISOString(),
            done: false,
        }

        await this.client.put({
            TableName: this.tableName,
            Item: data,
        }).promise();
        logger.info("Created todo", dto);

        return data;
    };

    async deleteTodo(todoId: string, userId: string) {
        logger.info("Deleting todo", {todoId, userId});
        const result = await this.client.delete({
            TableName: this.tableName,
            Key: {
                todoId,
                userId,
            },
        }).promise();

        if (!result.$response.data) throw new Error("Todo item does not exist");
    }

    async getTodo(todoId: string, userId: string) {
        logger.info("Getting todo",{ todoId, userId});
        const result = await this.client.get({
            TableName: this.tableName,
            Key: {
                todoId,
                userId,
            }
        }).promise();
        logger.info("Retrieved todo", { todoId, userId, todo: result.Item });

        return result.Item;
    }

    async fetchTodos(userId: string, startKey?: Key) {
        logger.info(`Fetching todos for user with ID "${userId}"`);
        const result = await this.client.query({
            TableName: this.tableName,
            ExclusiveStartKey: startKey,
            KeyConditionExpression: "userId = :userId",
            ExpressionAttributeValues: {
                ':userId': userId,
            }
        }).promise();

        return {
            todos: result.Items,
            evaluatedKey: result.LastEvaluatedKey,
        }
    }
    async updateTodo(dto: UpdateTodoRequest, todoId: string, userId: string) {
        logger.info(`Updating todo with ID "${todoId}"; userID "${userId}"`);
        const currentTodo = await this.getTodo(todoId, userId);
        await this.client.put({
            TableName: this.tableName,
            Item: {
                ...currentTodo,
                ...dto,
                todoId,
                userId,
            }
        }).promise();

        return {
            ...currentTodo,
            ...dto,
        }
    }
}

function createDynamoDBClient() {
    if (process.env.IS_OFFLINE) {
        console.log('Creating a local DynamoDB instance')
        // @ts-ignore
        return new XAWS.DynamoDB.DocumentClient({
            region: 'localhost',
            endpoint: 'http://localhost:8000'
        })
    }
    // @ts-ignore
    return new XAWS.DynamoDB.DocumentClient()
}