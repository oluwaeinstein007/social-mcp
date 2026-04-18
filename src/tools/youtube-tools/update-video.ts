import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getYouTubeService } from "../../services/youtube-service.js";

const params = z.object({
	videoId: z.string().describe("YouTube video ID to update"),
	title: z.string().min(1).max(100).describe("New video title"),
	description: z.string().max(5000).describe("New video description"),
	tags: z.array(z.string()).optional().describe("List of tags for the video"),
	categoryId: z.string().default("22").describe("YouTube category ID (default: 22 = People & Blogs)"),
});

type Params = z.infer<typeof params>;

export const updateVideoTool = {
	name: "YOUTUBE_UPDATE_VIDEO",
	description: "Update the title, description, and tags of a YouTube video you own",
	parameters: params,
	execute: async (p: Params) => {
		try {
			const result = await getYouTubeService().updateVideo(
				p.videoId,
				p.title,
				p.description,
				p.tags,
				p.categoryId,
			);
			return [
				`Video updated successfully!`,
				`Video ID: ${result.id ?? p.videoId}`,
				`Title: ${result.snippet?.title ?? p.title}`,
				`URL: https://www.youtube.com/watch?v=${p.videoId}`,
			].join("\n");
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error updating YouTube video: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
