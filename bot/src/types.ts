// Shared types for the social-mcp bot

export type ToolExecutor = (
	name: string,
	args: Record<string, unknown>,
) => Promise<string>;
