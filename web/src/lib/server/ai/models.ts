import { createOpenAI } from '@ai-sdk/openai';
import { customProvider } from 'ai';
import { OPENAI_API_KEY } from '$env/static/private';

const openai = createOpenAI({ apiKey: OPENAI_API_KEY });

export const myProvider = customProvider({
	languageModels: {
		'chat-model': openai('gpt-5'),
		'chat-model-reasoning': openai('gpt-5'),
		'title-model': openai('gpt-5-nano'),
		'artifact-model': openai('gpt-5-mini')
	}
});
