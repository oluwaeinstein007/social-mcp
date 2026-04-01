import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

interface McpTool {
	name: string;
	description?: string;
	inputSchema: object;
}

export class SocialMcpClient {
	private client: Client;
	private _tools: McpTool[] = [];
	private connected = false;

	constructor() {
		this.client = new Client({
			name: "social-mcp-bot",
			version: "1.0.0",
		});
	}

	async connect(serverPath: string): Promise<void> {
		const transport = new StdioClientTransport({
			command: "node",
			args: [serverPath],
			// Forward all env vars so social-mcp can access platform credentials
			env: { ...process.env } as Record<string, string>,
		});

		await this.client.connect(transport);
		this.connected = true;

		const { tools } = await this.client.listTools();
		this._tools = tools as McpTool[];

		console.log(
			`✅ MCP: connected to social-mcp (${this._tools.length} tools available)`,
		);
		console.log(
			`   Tools: ${this._tools.map((t) => t.name).join(", ")}`,
		);
	}

	get tools(): McpTool[] {
		return this._tools;
	}

	async callTool(
		name: string,
		args: Record<string, unknown>,
	): Promise<string> {
		if (!this.connected) {
			throw new Error("MCP client is not connected to social-mcp server");
		}

		const result = await this.client.callTool({ name, arguments: args });

		// Extract text from the content array
		const content = result.content as Array<{
			type: string;
			text?: string;
		}>;

		const text = content
			.filter((c) => c.type === "text" && c.text)
			.map((c) => c.text as string)
			.join("\n");

		return text || "Tool executed successfully (no text output).";
	}

	async disconnect(): Promise<void> {
		if (this.connected) {
			await this.client.close();
			this.connected = false;
		}
	}
}
