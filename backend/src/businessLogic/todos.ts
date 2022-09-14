import { TodosAccess } from '../dataLayer/todosAcess'
import { AttachmentUtils } from '../dataLayer/attachmentUtils';
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'
import * as createError from 'http-errors'
import { Key } from 'aws-sdk/clients/dynamodb';

// TODO: Implement businessLogic
const logger = createLogger('todos');
const todosAcess = new TodosAccess();
const attachmentUtils = new AttachmentUtils();

export async function createTodo (dto: CreateTodoRequest, userId: string) {
    logger.info(`Creating todo: name="${dto.name}"`);
    const id = uuid.v4();
    return await todosAcess.createTodo({ ...dto, todoId: id }, userId);
}

export async function getTodo(todoId: string, userId: string): Promise<TodoItem | null> {
    return await todosAcess.getTodo(todoId, userId) as TodoItem;
}

export async function deleteTodo(todoId: string, userId: string) {
    logger.info('Deleting todo', {todoId, userId});
    return await todosAcess.deleteTodo(todoId, userId);
}

export async function getTodosForUser(userId: string, startKey?: Key) {
    const {todos, ...rest} = await todosAcess.fetchTodos(userId, startKey);
    return {
        ...rest,
        todos: todos.map((todo) => ({
            ...todo,
            attachmentUrl: attachmentUtils.getDownloadSignedUrl(todo.todoId),
        }))
    }
}

export async function updateTodo(dto: UpdateTodoRequest, todoId: string, userId: string) {
    return await todosAcess.updateTodo(dto, todoId, userId);
}

export function createAttachmentPresignedUrl(todoId: string) {
    const attachmentUrl = attachmentUtils.getUploadSignedUrl(todoId);
    return attachmentUrl;
}
