<script lang="ts">
	import { fly } from 'svelte/transition';
</script>

<div
	class="group/message mx-auto w-full max-w-3xl px-4"
	data-role="assistant"
	in:fly={{ opacity: 0, y: 5 }}
>
	<div
		class="
      group-data-[role=user]/message:bg-muted flex w-full gap-4 rounded-xl group-data-[role=user]/message:ml-auto
      group-data-[role=user]/message:w-fit group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:px-3
      group-data-[role=user]/message:py-2
    "
	>
		<div class="ring-border flex size-8 shrink-0 items-center justify-center rounded-full ring-1">
			<svg class="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
				<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
			</svg>
		</div>

		<div class="flex w-full flex-col gap-2">
			<div class="text-muted-foreground flex items-center gap-2">
				<span>Thinking</span>
				<span class="inline-flex">
					<span class="animate-[bounce_1s_ease-in-out_infinite]">.</span>
					<span class="animate-[bounce_1s_ease-in-out_0.2s_infinite]">.</span>
					<span class="animate-[bounce_1s_ease-in-out_0.4s_infinite]">.</span>
				</span>
			</div>
		</div>
	</div>
</div>
