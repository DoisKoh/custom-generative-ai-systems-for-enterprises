import { getChatsByUserId } from '$lib/server/db/queries.js';
import { allowAnonymousChats } from '$lib/utils/constants.js';
import { error } from '@sveltejs/kit';

export async function GET({ locals: { user } }) {
	// Allow anonymous users to get empty history
	if (!user && !allowAnonymousChats) {
		error(401, 'Unauthorized');
	}

	// Return empty array for anonymous users
	if (!user) {
		return Response.json([]);
	}

	return await getChatsByUserId({ id: user.id }).match(
		(chats) => Response.json(chats),
		() => error(500, 'An error occurred while processing your request')
	);
}
