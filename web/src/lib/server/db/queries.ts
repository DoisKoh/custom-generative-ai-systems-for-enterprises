import { ResultAsync, errAsync, okAsync } from 'neverthrow';
import {
	type User,
	type Suggestion,
	type Message,
	type Session,
	type AuthUser,
	type Chat,
	type Vote
} from './schema';
import type { DbError } from '$lib/errors/db';
import { DbInternalError } from '$lib/errors/db';

// Database is disabled for this demo
// All database functions return empty results or no-op
const DB_DISABLED_ERROR = new DbInternalError({
	cause: new Error('Database is disabled. This demo runs without database persistence.')
});

export function getAuthUser(_email: string): ResultAsync<AuthUser, DbError> {
	return errAsync(DB_DISABLED_ERROR);
}

export function getUser(_email: string): ResultAsync<User, DbError> {
	return errAsync(DB_DISABLED_ERROR);
}

export function getUserById(_id: string): ResultAsync<User, DbError> {
	return errAsync(DB_DISABLED_ERROR);
}

export function createUser(_email: string, _password: string): ResultAsync<User, DbError> {
	return errAsync(DB_DISABLED_ERROR);
}

export function getChatsForUser(_userId: string): ResultAsync<Array<Chat>, DbError> {
	return okAsync([]);
}

export function getChatById(_chatId: string): ResultAsync<Chat, DbError> {
	return errAsync(DB_DISABLED_ERROR);
}

export function saveChat(_chat: Chat): ResultAsync<undefined, DbError> {
	return okAsync(undefined);
}

export function deleteChatById(_chatId: string): ResultAsync<undefined, DbError> {
	return okAsync(undefined);
}

export function getMessagesByChatId(_chatId: string): ResultAsync<Array<Message>, DbError> {
	return okAsync([]);
}

export function saveMessages(_messages: Array<Message>): ResultAsync<undefined, DbError> {
	return okAsync(undefined);
}

export function voteMessage(_vote: Vote): ResultAsync<undefined, DbError> {
	return okAsync(undefined);
}

export function getVotesByChatId(_chatId: string): ResultAsync<Array<Vote>, DbError> {
	return okAsync([]);
}

export function saveDocument(_doc: any): ResultAsync<undefined, DbError> {
	return okAsync(undefined);
}

export function getDocumentById(_id: string): ResultAsync<any, DbError> {
	return errAsync(DB_DISABLED_ERROR);
}

export function saveSuggestions(_suggestions: Array<Suggestion>): ResultAsync<undefined, DbError> {
	return okAsync(undefined);
}

export function getSuggestionsByDocumentId(
	_documentId: string
): ResultAsync<Array<Suggestion>, DbError> {
	return okAsync([]);
}

export function getFullSession(
	_sessionId: string
): ResultAsync<{ user: User; session: Session }, DbError> {
	return errAsync(DB_DISABLED_ERROR);
}

export function createSession(_session: Session): ResultAsync<undefined, DbError> {
	return okAsync(undefined);
}

export function extendSession(_sessionId: string): ResultAsync<undefined, DbError> {
	return okAsync(undefined);
}

export function deleteSession(_sessionId: string): ResultAsync<undefined, DbError> {
	return okAsync(undefined);
}

export function deleteSessionsForUser(_userId: string): ResultAsync<undefined, DbError> {
	return okAsync(undefined);
}

export function updateChatVisibility(
	_chatId: string,
	_visibility: 'public' | 'private'
): ResultAsync<undefined, DbError> {
	return okAsync(undefined);
}
