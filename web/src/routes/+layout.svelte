<script lang="ts">
	import '../app.css';
	import { ThemeProvider } from '@sejohnson/svelte-themes';
	import { Toaster } from '$lib/components/ui/sonner';
	import { TooltipProvider } from '$lib/components/ui/tooltip';

	let { children } = $props();
</script>

<ThemeProvider attribute="class" disableTransitionOnChange>
	<TooltipProvider>
		<Toaster position="top-center" />
		{@render children()}
	</TooltipProvider>
</ThemeProvider>
