import { myProvider } from '$lib/server/ai/models';
import { systemPrompt } from '$lib/server/ai/prompts.js';
import { generateTitleFromUserMessage } from '$lib/server/ai/utils';
import { deleteChatById, getChatById, saveChat, saveMessages } from '$lib/server/db/queries.js';
import type { Chat } from '$lib/server/db/schema';
import { getMostRecentUserMessage, getTrailingMessageId } from '$lib/utils/chat.js';
import { allowAnonymousChats } from '$lib/utils/constants.js';
import { error } from '@sveltejs/kit';
import {
	appendResponseMessages,
	createDataStreamResponse,
	smoothStream,
	streamText,
	type UIMessage,
	tool
} from 'ai';
import { ok, safeTry } from 'neverthrow';
import { getNearbyHawkers, checkHawkerClosures, getHawkerDetails } from '$lib/server/mcp/client';
import { z } from 'zod';

export async function POST({ request, locals: { user }, cookies }) {
	// TODO: zod?
	const {
		id,
		messages,
		userLocation
	}: {
		id: string;
		messages: UIMessage[];
		userLocation?: { latitude: number; longitude: number };
	} = await request.json();
	const selectedChatModel = cookies.get('selected-model');

	if (!user && !allowAnonymousChats) {
		error(401, 'Unauthorized');
	}

	if (!selectedChatModel) {
		error(400, 'No chat model selected');
	}

	const userMessage = getMostRecentUserMessage(messages);

	if (!userMessage) {
		error(400, 'No user message found');
	}

	if (user) {
		await safeTry(async function* () {
			let chat: Chat;
			const chatResult = await getChatById({ id });
			if (chatResult.isErr()) {
				if (chatResult.error._tag !== 'DbEntityNotFoundError') {
					return chatResult;
				}
				const title = yield* generateTitleFromUserMessage({ message: userMessage });
				chat = yield* saveChat({ id, userId: user.id, title });
			} else {
				chat = chatResult.value;
			}

			if (chat.userId !== user.id) {
				error(403, 'Forbidden');
			}

			yield* saveMessages({
				messages: [
					{
						chatId: id,
						id: userMessage.id,
						role: 'user',
						parts: userMessage.parts,
						attachments: userMessage.experimental_attachments ?? [],
						createdAt: new Date()
					}
				]
			});

			return ok(undefined);
		}).orElse(() => error(500, 'An error occurred while processing your request'));
	}

	return createDataStreamResponse({
		execute: (dataStream) => {
			const result = streamText({
				model: myProvider.languageModel(selectedChatModel),
				system: systemPrompt({ selectedChatModel, userLocation }),
				messages,
				maxSteps: 5,
				experimental_activeTools:
					selectedChatModel === 'chat-model-reasoning'
						? []
						: ['getNearbyHawkers', 'checkHawkerClosures', 'getHawkerDetails'],
				experimental_generateMessageId: crypto.randomUUID.bind(crypto),
				tools: {
					getNearbyHawkers: tool({
						description:
							'Find Hawker centres near a GPS location, sorted by distance. This returns comprehensive information including name, address, distance, number of stalls, and status. Use this as your PRIMARY tool - it provides all the basic information you need. Use 2000 for radius and 10 for limit as defaults.',
						parameters: z.object({
							latitude: z.number().describe("User's latitude coordinate"),
							longitude: z.number().describe("User's longitude coordinate"),
							radius: z.number().describe('Search radius in meters'),
							limit: z.number().describe('Maximum number of results')
						}),
						execute: async ({ latitude, longitude, radius, limit }) => {
							return await getNearbyHawkers(latitude, longitude, radius, limit);
						}
					}),
					checkHawkerClosures: tool({
						description:
							'Check if specific Hawker centres have scheduled closures. ONLY use this if the user specifically asks about closures or if you need closure dates. Do NOT call this for every hawker - only call it once for hawkers the user is interested in.',
						parameters: z.object({
							hawkerName: z
								.string()
								.describe(
									'Exact name of the Hawker centre to check (must match the name from getNearbyHawkers)'
								)
						}),
						execute: async ({ hawkerName }) => {
							return await checkHawkerClosures(hawkerName);
						}
					}),
					getHawkerDetails: tool({
						description:
							'Get additional detailed information (description, photo URL) about a specific Hawker centre. ONLY use this if the user asks for more details about a specific hawker or wants to see photos. The getNearbyHawkers tool already provides most information. When you get the result, include the markdown image in your response so it displays to the user.',
						parameters: z.object({
							hawkerName: z
								.string()
								.describe(
									'Exact name of the Hawker centre (must match the name from getNearbyHawkers)'
								)
						}),
						execute: async ({ hawkerName }) => {
							return await getHawkerDetails(hawkerName);
						}
					})
				},
				onStepFinish: async ({ stepType, toolCalls, toolResults }) => {
					console.log('Step finished:', stepType);
					if (toolCalls) {
						console.log('Tool calls:', toolCalls);
					}
					if (toolResults) {
						console.log('Tool results:', toolResults);
					}
				},
				onFinish: async ({ response }) => {
					if (!user) return;
					const assistantId = getTrailingMessageId({
						messages: response.messages.filter((message) => message.role === 'assistant')
					});

					if (!assistantId) {
						throw new Error('No assistant message found!');
					}

					const [, assistantMessage] = appendResponseMessages({
						messages: [userMessage],
						responseMessages: response.messages
					});

					await saveMessages({
						messages: [
							{
								id: assistantId,
								chatId: id,
								role: assistantMessage.role,
								parts: assistantMessage.parts,
								attachments: assistantMessage.experimental_attachments ?? [],
								createdAt: new Date()
							}
						]
					});
				},
				experimental_telemetry: {
					isEnabled: true,
					functionId: 'stream-text'
				}
			});

			result.consumeStream();

			result.mergeIntoDataStream(dataStream, {
				sendReasoning: true
			});
		},
		onError: (e) => {
			console.error(e);
			return 'Oops!';
		}
	});
}

export async function DELETE({ locals: { user }, request }) {
	// TODO: zod
	const { id }: { id: string } = await request.json();
	if (!user) {
		error(401, 'Unauthorized');
	}

	return await getChatById({ id })
		.andTee((chat) => {
			if (chat.userId !== user.id) {
				error(403, 'Forbidden');
			}
		})
		.andThen(deleteChatById)
		.match(
			() => new Response('Chat deleted', { status: 200 }),
			() => error(500, 'An error occurred while processing your request')
		);
}
