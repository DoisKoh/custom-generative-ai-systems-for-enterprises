import { spawn, type ChildProcess } from 'child_process';
import { resolve } from 'path';

interface MCPToolCall {
	name: string;
	arguments: Record<string, unknown>;
}

interface MCPResponse {
	content: Array<{ type: string; text: string }>;
}

class MCPClient {
	private process: ChildProcess | null = null;
	private messageId = 0;
	private pendingRequests = new Map<
		number,
		{ resolve: (value: unknown) => void; reject: (error: Error) => void }
	>();

	async start(): Promise<void> {
		if (this.process) {
			return; // Already started
		}

		const serverPath = resolve(process.cwd(), 'mcp-server/dist/index.js');

		console.error('[MCP Client] Starting MCP server:', serverPath);

		this.process = spawn('node', [serverPath], {
			stdio: ['pipe', 'pipe', 'pipe'],
			cwd: resolve(process.cwd(), 'mcp-server')
		});

		if (!this.process.stdout || !this.process.stdin) {
			throw new Error('Failed to create stdio streams');
		}

		// Handle stdout messages
		let buffer = '';
		this.process.stdout.on('data', (data: Buffer) => {
			buffer += data.toString();
			const lines = buffer.split('\n');
			buffer = lines.pop() || '';

			for (const line of lines) {
				if (line.trim()) {
					try {
						const message = JSON.parse(line);
						this.handleMessage(message);
					} catch (error) {
						console.error('[MCP Client] Failed to parse message:', line, error);
					}
				}
			}
		});

		// Handle stderr (logging)
		this.process.stderr?.on('data', (data: Buffer) => {
			console.error('[MCP Server]', data.toString().trim());
		});

		// Handle process exit
		this.process.on('exit', (code) => {
			console.error('[MCP Client] Server exited with code:', code);
			this.process = null;
			// Reject all pending requests
			for (const [, { reject }] of this.pendingRequests) {
				reject(new Error('MCP server exited'));
			}
			this.pendingRequests.clear();
		});

		// Wait for server to be ready
		await new Promise((resolve) => setTimeout(resolve, 500));
	}

	private handleMessage(message: any): void {
		if (message.id !== undefined) {
			const pending = this.pendingRequests.get(message.id);
			if (pending) {
				this.pendingRequests.delete(message.id);
				if (message.error) {
					pending.reject(new Error(message.error.message || 'MCP error'));
				} else {
					pending.resolve(message.result);
				}
			}
		}
	}

	private async sendRequest(method: string, params: any): Promise<any> {
		if (!this.process?.stdin) {
			throw new Error('MCP server not started');
		}

		const id = ++this.messageId;
		const request = {
			jsonrpc: '2.0',
			id,
			method,
			params
		};

		return new Promise((resolve, reject) => {
			this.pendingRequests.set(id, { resolve, reject });

			const message = JSON.stringify(request) + '\n';
			this.process!.stdin!.write(message, (error) => {
				if (error) {
					this.pendingRequests.delete(id);
					reject(error);
				}
			});

			// Timeout after 30 seconds
			setTimeout(() => {
				if (this.pendingRequests.has(id)) {
					this.pendingRequests.delete(id);
					reject(new Error('MCP request timeout'));
				}
			}, 30000);
		});
	}

	async callTool(name: string, args: Record<string, unknown>): Promise<MCPResponse> {
		await this.start();

		const result = await this.sendRequest('tools/call', {
			name,
			arguments: args
		});

		return result;
	}

	async listTools(): Promise<Array<{ name: string; description: string; inputSchema: any }>> {
		await this.start();

		const result = await this.sendRequest('tools/list', {});
		return result.tools;
	}

	stop(): void {
		if (this.process) {
			console.error('[MCP Client] Stopping MCP server');
			this.process.kill();
			this.process = null;
		}
	}
}

// Singleton instance
let mcpClient: MCPClient | null = null;

export function getMCPClient(): MCPClient {
	if (!mcpClient) {
		mcpClient = new MCPClient();
	}
	return mcpClient;
}

// Helper functions for each tool
export async function getNearbyHawkers(
	latitude: number,
	longitude: number,
	radius?: number,
	limit?: number
): Promise<string> {
	const client = getMCPClient();
	const response = await client.callTool('get_nearby_hawkers', {
		latitude,
		longitude,
		radius: radius ?? 2000,
		limit: limit ?? 10
	});
	return response.content[0].text;
}

export async function checkHawkerClosures(hawkerName: string): Promise<string> {
	const client = getMCPClient();
	const response = await client.callTool('check_hawker_closures', {
		hawkerName
	});
	return response.content[0].text;
}

export async function getHawkerDetails(hawkerName: string): Promise<string> {
	const client = getMCPClient();
	const response = await client.callTool('get_hawker_details', {
		hawkerName
	});
	return response.content[0].text;
}
