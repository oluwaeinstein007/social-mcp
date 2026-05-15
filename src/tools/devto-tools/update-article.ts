import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { DevToService, getDevToService } from "../../services/devto-service.js";

const params = z.object({
	id: z.number().int().positive().describe("Article ID to update"),
	title: z.string().min(1).max(255).optional().describe("New title"),
	bodyMarkdown: z.string().optional().describe("New body content in Markdown"),
	published: z.boolean().optional().describe("Set to true to publish a draft"),
	tags: z.array(z.string()).max(4).optional().describe("Updated tags (replaces existing tags)"),
	description: z.string().max(160).optional().describe("New short description"),
	canonicalUrl: z.string().url().optional().describe("New canonical URL"),
	apiKey: z.string().optional().describe("Dev.to API key (overrides DEVTO_API_KEY env var)"),
});

type Params = z.infer<typeof params>;

export const updateArticleTool = {
	name: "DEVTO_UPDATE_ARTICLE",
	description: "Update an existing Dev.to article. Only provided fields are changed.",
	parameters: params,
	execute: async (p: Params) => {
		try {
			const service = p.apiKey ? new DevToService({ apiKey: p.apiKey }) : getDevToService();

			const updates: Record<string, unknown> = {};
			if (p.title !== undefined) updates.title = p.title;
			if (p.bodyMarkdown !== undefined) updates.body_markdown = p.bodyMarkdown;
			if (p.published !== undefined) updates.published = p.published;
			if (p.tags !== undefined) updates.tags = p.tags;
			if (p.description !== undefined) updates.description = p.description;
			if (p.canonicalUrl !== undefined) updates.canonical_url = p.canonicalUrl;

			const a = await service.updateArticle(p.id, updates);
			return [
				`Article updated on Dev.to!`,
				``,
				`Title: ${a.title}`,
				`ID: ${a.id}`,
				`Published: ${a.published ? "Yes" : "Draft"}`,
				...(a.url ? [`URL: ${a.url}`] : []),
			].join("\n");
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error updating Dev.to article: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
