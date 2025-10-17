<script lang="ts">
	import { ChatHistory } from '$lib/hooks/chat-history.svelte.js';
	import { SidebarProvider } from '$lib/components/ui/sidebar';

	let { data, children } = $props();

	const chatHistory = new ChatHistory(data.chats);
	chatHistory.setContext();
	data.selectedChatModel.setContext();
</script>

<SidebarProvider open={false}>
	<div class="mx-auto w-full max-w-7xl">
		{@render children?.()}
	</div>
</SidebarProvider>
