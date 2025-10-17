<script lang="ts">
	import MessageIcon from '../icons/message.svelte';
	import { scale } from 'svelte/transition';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
</script>

<div class="mx-auto max-w-3xl md:mt-20" transition:scale={{ opacity: 0, start: 0.98 }}>
	<div class="flex max-w-xl flex-col gap-8 rounded-xl p-6 text-center leading-relaxed">
		<p class="flex flex-row items-center justify-center gap-4">
			<MessageIcon size={32} />
			<span>+</span>
			<MapPinIcon size={32} />
		</p>
		<h1 class="text-2xl font-semibold">Hawker Centre Finder</h1>
		<p>
			This is a demonstration of an AI agent with Retrieval Augmented Generation (RAG) capabilities
			for the <strong>NUS-ISS Custom Generative AI Systems for Enterprises</strong> course.
		</p>
		<p>
			The chatbot uses your GPS location to recommend nearby Hawker centres in Singapore.
			Try asking questions like:
		</p>
		<ul class="text-left list-disc list-inside space-y-1">
			<li>"Where can I eat nearby?"</li>
			<li>"Find Hawker centres within 1km"</li>
			<li>"Is [Hawker Centre Name] closed today?"</li>
		</ul>
		<p class="text-sm text-muted-foreground">
			Powered by OpenAI GPT-5, Model Context Protocol (MCP), and data.gov.sg APIs
		</p>
	</div>
</div>
