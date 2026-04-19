import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getYouTubeService } from "../../services/youtube-service.js";

const params = z.object({
	videoId: z.string().describe("YouTube video ID"),
	maxResults: z
		.number()
		.int()
		.min(1)
		.max(100)
		.default(20)
		.describe("Number of comments to return (1-100)"),
});

type Params = z.infer<typeof params>;

export const getCommentsTool = {
	name: "YOUTUBE_GET_COMMENTS",
	description: "Get top-level comments on a YouTube video",
	parameters: params,
	execute: async (p: Params) => {
		try {
			const result = await getYouTubeService().getComments(
				p.videoId,
				p.maxResults,
			);
			const items = result.items;
			if (!items?.length) return "No comments found for this video.";
			const lines = items.map((item, i) => {
				const c = item.snippet?.topLevelComment?.snippet;
				const author = c?.authorDisplayName ?? "Unknown";
				const text = c?.textDisplay ?? "";
				const likes = c?.likeCount ?? 0;
				const replies = item.snippet?.totalReplyCount ?? 0;
				const date = c?.publishedAt ?? "";
				return `${i + 1}. ${author} (${date})\n   ${text}\n   Likes: ${likes} | Replies: ${replies}`;
			});
			return [`Comments on video ${p.videoId}:`, "", ...lines].join("\n");
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error fetching YouTube comments: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
