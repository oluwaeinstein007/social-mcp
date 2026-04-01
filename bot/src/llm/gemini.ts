import { FunctionCallingConfigMode, GoogleGenAI } from "@google/genai";
import type {
	Chat,
	FunctionDeclaration,
	Part,
} from "@google/genai";
import type { ToolExecutor } from "../types.js";

const SYSTEM_PROMPT = `You are a helpful social media and productivity assistant.

You have access to powerful tools that let you:
- Post tweets and search Twitter/X
- Send messages on Telegram, Discord, Slack, and WhatsApp
- Create posts on Facebook and Instagram
- Get current weather for any city in the world

When a user asks you to perform an action on a social media platform, use the appropriate tool.
When a user asks about weather, always use the get_weather tool.
Be concise and friendly. Confirm what you did after taking an action.
If a tool requires information the user didn't provide (e.g. a channel ID), ask for it.
Never make up tool results — always actually call the tool.`;

export class GeminiAgent {
	private session: Chat;
	private toolExecutor: ToolExecutor;

	constructor(
		apiKey: string,
		tools: FunctionDeclaration[],
		toolExecutor: ToolExecutor,
	) {
		const ai = new GoogleGenAI({ apiKey });

		this.session = ai.chats.create({
			model: "gemini-2.0-flash",
			config: {
				systemInstruction: SYSTEM_PROMPT,
				tools: tools.length > 0 ? [{ functionDeclarations: tools }] : undefined,
				toolConfig: {
					functionCallingConfig: {
						mode: FunctionCallingConfigMode.AUTO,
					},
				},
			},
		});

		this.toolExecutor = toolExecutor;
	}

	async sendMessage(userMessage: string): Promise<string> {
		let response = await this.session.sendMessage({
			message: userMessage,
		});

		// Tool-calling loop: keep executing tools until Gemini returns a text response
		while (response.functionCalls && response.functionCalls.length > 0) {
			const parts: Part[] = [];

			for (const fc of response.functionCalls) {
				const toolName = fc.name ?? "";
				const toolArgs = (fc.args as Record<string, unknown>) ?? {};

				let toolResult: string;
				try {
					toolResult = await this.toolExecutor(toolName, toolArgs);
				} catch (err) {
					toolResult = `Error executing tool "${toolName}": ${err instanceof Error ? err.message : "Unknown error"}`;
				}

				parts.push({
					functionResponse: {
						name: toolName,
						response: { output: toolResult },
					},
				});
			}

			response = await this.session.sendMessage({ message: parts });
		}

		return response.text ?? "I was unable to generate a response. Please try again.";
	}
}
