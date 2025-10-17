<script lang="ts">
	import { cn } from '$lib/utils/shadcn';
	import SparklesIcon from '../icons/sparkles.svelte';
	import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
	import { Button } from '../ui/button';
	import PencilEditIcon from '../icons/pencil-edit.svelte';
	import PreviewAttachment from '../preview-attachment.svelte';
	import { Markdown } from '../markdown';
	import MessageReasoning from '../message-reasoning.svelte';
	import { fly } from 'svelte/transition';
	import type { UIMessage } from '@ai-sdk/svelte';

	let {
		message,
		readonly,
		loading,
		isLastMessage,
		expandedToolResults,
		toggleToolResult
	}: {
		message: UIMessage;
		readonly: boolean;
		loading: boolean;
		isLastMessage: boolean;
		expandedToolResults: Set<string>;
		toggleToolResult: (toolCallId: string) => void;
	} = $props();

	let mode = $state<'view' | 'edit'>('view');

	let hasActiveToolCall = $derived(
		message.parts.some(
			(p) =>
				p.type === 'tool-invocation' &&
				'toolInvocation' in p &&
				(p.toolInvocation.state === 'call' || p.toolInvocation.state === 'partial-call')
		)
	);

	let shouldShowThinking = $derived(
		message.role === 'assistant' &&
			isLastMessage &&
			loading &&
			!hasActiveToolCall &&
			message.parts.length > 0
	);
</script>

<div
	class="group/message mx-auto w-full max-w-3xl px-4"
	data-role={message.role}
	in:fly|global={{ opacity: 0, y: 5 }}
>
	<div
		class={cn(
			'flex w-full gap-4 group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl',
			{
				'w-full': mode === 'edit',
				'group-data-[role=user]/message:w-fit': mode !== 'edit'
			}
		)}
	>
		{#if message.role === 'assistant'}
			<div
				class="bg-background ring-border flex size-8 shrink-0 items-center justify-center rounded-full ring-1"
			>
				<div class="translate-y-px">
					<SparklesIcon size={14} />
				</div>
			</div>
		{/if}

		<div class="flex w-full flex-col gap-4">
			{#if message.experimental_attachments && message.experimental_attachments.length > 0}
				<div class="flex flex-row justify-end gap-2">
					{#each message.experimental_attachments as attachment (attachment.url)}
						<PreviewAttachment {attachment} />
					{/each}
				</div>
			{/if}

			{#if shouldShowThinking}
				<div
					class="bg-muted/50 flex items-center gap-2 rounded-lg p-2 text-sm"
					in:fly|global={{ opacity: 0, y: 5, duration: 200 }}
				>
					<svg
						class="h-3 w-3 shrink-0 animate-spin"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
					>
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
						></circle>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
					<span class="text-muted-foreground text-xs">Thinking...</span>
				</div>
			{/if}

			{#each message.parts as part, i (`${message.id}-${i}`)}
				{@const { type } = part}
				{#if type === 'reasoning'}
					<MessageReasoning {loading} reasoning={part.reasoning} />
				{:else if type === 'text'}
					{#if mode === 'view'}
						<div class="flex flex-row items-start gap-2">
							{#if message.role === 'user' && !readonly}
								<Tooltip>
									<TooltipTrigger>
										{#snippet child({ props })}
											<Button
												{...props}
												variant="ghost"
												class="text-muted-foreground h-fit rounded-full px-2 opacity-0 group-hover/message:opacity-100"
												onclick={() => {
													mode = 'edit';
												}}
											>
												<PencilEditIcon />
											</Button>
										{/snippet}
									</TooltipTrigger>
									<TooltipContent>Edit message</TooltipContent>
								</Tooltip>
							{/if}
							<div
								class={cn('flex flex-col gap-4', {
									'bg-primary text-primary-foreground rounded-xl px-3 py-2': message.role === 'user'
								})}
							>
								<Markdown md={part.text} />
							</div>
						</div>
					{:else if mode === 'edit'}
						<div class="flex flex-row items-start gap-2">
							<div class="size-8"></div>

							<!-- TODO -->
							<!-- <MessageEditor key={message.id} {message} {setMode} {setMessages} {reload} /> -->
						</div>
					{/if}
				{:else if type === 'tool-invocation'}
					{@const { toolInvocation } = part}
					{@const { toolName, state, toolCallId } = toolInvocation}
					{@const { args } = 'args' in toolInvocation ? toolInvocation : { args: {} }}
					{@const argsString = JSON.stringify(args, null, 2)}
					{@const shouldTruncate = argsString.length > 500}
					{@const displayArgs = shouldTruncate ? argsString.slice(0, 500) + '...' : argsString}
					{@const isLoading = state === 'call' || state === 'partial-call'}
					{@const isComplete = state === 'result'}

					<div
						class="bg-muted rounded-lg p-3 text-sm transition-all duration-200"
						in:fly|global={{ opacity: 0, y: 5, duration: 200 }}
					>
						<button
							type="button"
							class="text-muted-foreground hover:text-foreground mb-1 flex w-full cursor-pointer items-center gap-2 text-left transition-colors disabled:cursor-default"
							onclick={() => {
								if (isComplete) toggleToolResult(toolCallId);
							}}
							disabled={!isComplete}
						>
							{#if isLoading}
								<svg
									class="h-3 w-3 shrink-0 animate-spin"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
								>
									<circle
										class="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										stroke-width="4"
									></circle>
									<path
										class="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									></path>
								</svg>
							{:else if isComplete}
								<svg
									class="h-3 w-3 shrink-0 text-green-600"
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										fill-rule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clip-rule="evenodd"
									/>
								</svg>
							{/if}
							<span class="flex-1 font-medium">
								{#if toolName === 'getNearbyHawkers'}
									{isLoading ? 'Finding' : 'Found'} nearby Hawker centres
								{:else if toolName === 'checkHawkerClosures'}
									{isLoading ? 'Checking' : 'Checked'} closure information
								{:else if toolName === 'getHawkerDetails'}
									{isLoading ? 'Getting' : 'Got'} Hawker centre details
								{:else}
									{isLoading ? 'Calling' : 'Called'} {toolName}
								{/if}
								{#if isLoading}
									<span class="inline-flex">
										<span class="animate-[bounce_1s_ease-in-out_infinite]">.</span>
										<span class="animate-[bounce_1s_ease-in-out_0.2s_infinite]">.</span>
										<span class="animate-[bounce_1s_ease-in-out_0.4s_infinite]">.</span>
									</span>
								{/if}
							</span>
							{#if isComplete}
								<svg
									class="h-4 w-4 shrink-0 transition-transform duration-200"
									class:rotate-180={expandedToolResults.has(toolCallId)}
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										fill-rule="evenodd"
										d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
										clip-rule="evenodd"
									/>
								</svg>
							{/if}
						</button>
						{#if isLoading && args && Object.keys(args).length > 0}
							<div
								class="text-muted-foreground font-mono text-xs break-all whitespace-pre-wrap opacity-75"
								in:fly|global={{ opacity: 0, y: -5, duration: 150 }}
								out:fly|global={{ opacity: 0, y: -5, duration: 150 }}
							>
								{displayArgs}
							</div>
						{/if}
						{#if isComplete && 'result' in toolInvocation && expandedToolResults.has(toolCallId)}
							{@const result = toolInvocation.result}
							{@const resultString =
								typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
							{@const shouldTruncateResult = resultString.length > 2000}
							{@const displayResult = shouldTruncateResult
								? resultString.slice(0, 2000) + '\n\n... (truncated)'
								: resultString}
							<div
								class="text-muted-foreground border-border mt-2 max-h-96 overflow-y-auto border-t pt-2 font-mono text-xs break-all whitespace-pre-wrap opacity-75"
								in:fly|global={{ opacity: 0, y: 5, duration: 200 }}
							>
								{displayResult}
							</div>
						{/if}
					</div>
				{/if}
			{/each}
		</div>
	</div>
</div>
