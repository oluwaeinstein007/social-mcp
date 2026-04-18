import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getYouTubeService } from "../../services/youtube-service.js";

const params = z.object({
	videoId: z.string().describe("YouTube video ID to comment on"),
	text: z.string().min(1).describe("Comment text"),
});

type Params = z.infer<typeof params>;

export const postCommentTool = {
	name: "YOUTUBE_POST_COMMENT",
	description: "Post a top-level comment on a YouTube video",
	parameters: params,
	execute: async (p: Params) => {
		try {
			const result = await getYouTubeService().postComment(p.videoId, p.text);
			const commentId = result.id;
			return `Comment posted successfully!\nComment ID: ${commentId ?? "unknown"}\nURL: https://www.youtube.com/watch?v=${p.videoId}`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error posting YouTube comment: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
