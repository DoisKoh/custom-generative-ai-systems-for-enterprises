<script lang="ts">
	import type { Chat, User } from '$lib/server/db/schema';
	import VisibilitySelector from './visibility-selector.svelte';

	let {
		user,
		chat,
		readonly
	}: {
		user: User | undefined;
		chat: Chat | undefined;
		readonly: boolean;
	} = $props();
</script>

<header class="bg-background sticky top-0 flex items-center gap-2 p-2">
	{#if !readonly && chat}
		<VisibilitySelector {chat} class="order-1 md:order-3" />
	{/if}
</header>
